import { GetPublicKeyCommand, SignCommand } from '@aws-sdk/client-kms';
import { keccak256 } from '@ethersproject/keccak256';
import BN from 'bn.js';
import { utils } from 'ethers';

import { EcdsaPubKey, EcdsaSignature } from './asn1';
import { getKMSClient } from './kms';

export async function getPublicKeyEthAddress(
  keyId: string,
  regionId: string
): Promise<string> {
  const cmd = new GetPublicKeyCommand({ KeyId: keyId });
  const kmsClient = getKMSClient(regionId);
  const apiResponse = await kmsClient.send(cmd);

  const publicKey = apiResponse.PublicKey;
  if (!publicKey) {
    throw new Error(`Could not get Public Key from KMS.`);
  }

  const decodedAsn1Struct = EcdsaPubKey.decode(Buffer.from(publicKey), 'der');
  const decodedPublicKey = decodedAsn1Struct.pubKey.data;
  const decodedTrimmedPublicKey = decodedPublicKey.slice(
    1,
    decodedPublicKey.length
  );
  const keccakPublicKey = keccak256(decodedTrimmedPublicKey);
  const bufferKeccakPublicKey = Buffer.from(keccakPublicKey.slice(2), 'hex');
  const ethAddress = '0x' + bufferKeccakPublicKey.subarray(-20).toString('hex');

  return ethAddress;
}

export async function signHashRSV(
  hash: string,
  keyId: string,
  regionId: string
): Promise<{ r: string; s: string; v: string }> {
  const kmsClient = getKMSClient(regionId);
  const quoteHashBuffer = Buffer.from(hash.split('0x')[1]!, 'hex');
  const cmd = new SignCommand({
    KeyId: keyId,
    SigningAlgorithm: 'ECDSA_SHA_256',
    MessageType: 'DIGEST',
    Message: quoteHashBuffer,
  });

  const apiResponse = await kmsClient.send(cmd);
  const apiSignature = apiResponse.Signature;

  if (!apiSignature) {
    throw new Error('Could not fetch Signature from KMS.');
  }

  const decodedAsn1Struct = EcdsaSignature.decode(
    Buffer.from(apiSignature),
    'der'
  );
  const r: BN = decodedAsn1Struct.r;
  let s: BN = decodedAsn1Struct.s;

  const secp256k1N = new BN(
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
    16
  );
  const secp256k1halfN = secp256k1N.div(new BN(2));

  if (s.gt(secp256k1halfN)) {
    s = secp256k1N.sub(s);
  }

  let v = '';

  const publicKeyAddress = await getPublicKeyEthAddress(keyId, regionId);

  if (
    recoverEthAddress(quoteHashBuffer, 27, r, s).toLowerCase() ===
    publicKeyAddress.toLowerCase()
  ) {
    v = '1b';
  } else if (
    recoverEthAddress(quoteHashBuffer, 28, r, s).toLowerCase() ===
    publicKeyAddress.toLowerCase()
  ) {
    v = '1c';
  } else {
    throw new Error('Could not find v');
  }

  let rStr = r.toString(16);
  const rSlack = 64 - rStr.length;
  for (let i = 0; i < rSlack; i += 1) {
    rStr = '0' + rStr;
  }

  let sStr = s.toString(16);
  const sSlack = 64 - sStr.length;
  for (let i = 0; i < sSlack; i += 1) {
    sStr = '0' + sStr;
  }

  return {
    r: rStr,
    s: sStr,
    v,
  };
}

export function recoverEthAddress(
  msgDigest: Buffer,
  v: number,
  r: BN,
  s: BN
): string {
  const signature =
    '0x' +
    Buffer.concat([r.toBuffer(), s.toBuffer(), Buffer.from([v])]).toString(
      'hex'
    );

  const recoveredAddress = utils.recoverAddress(msgDigest, signature);

  return recoveredAddress;
}
