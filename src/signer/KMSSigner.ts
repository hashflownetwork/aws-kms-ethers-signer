import { SignatureLike } from '@ethersproject/bytes';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import { serialize } from '@ethersproject/transactions';
import { Bytes, Signer, UnsignedTransaction } from 'ethers';
import * as ethers from 'ethers';
import { getAddress, hashMessage, resolveProperties } from 'ethers/lib/utils';

import { getPublicKeyEthAddress, signHashRSV } from '../helpers/crypto';

export class KMSSigner extends Signer {
  readonly regionId: string;
  readonly keyId: string;
  readonly provider?: Provider;

  address?: string;

  constructor(regionId: string, keyId: string, provider?: Provider) {
    super();

    // We initialize the AWS KMS parameters.
    this.regionId = regionId;
    this.keyId = keyId;
    this.provider = provider;
  }

  connect(provider: Provider): KMSSigner {
    return new KMSSigner(this.regionId, this.keyId, provider);
  }

  async getAddress(): Promise<string> {
    // We memoize the address in order to avoid calling the KMS multiple times.
    if (this.address) {
      return this.address;
    }

    // We ensure that address has correct checksum.
    this.address = getAddress(
      await getPublicKeyEthAddress(this.keyId, this.regionId)
    );
    return this.address;
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const tx = await resolveProperties(transaction);
    if (tx.from) {
      if (getAddress(tx.from) !== this.address) {
        throw new Error(
          `Transaction from address mismatch: ${transaction.from}`
        );
      }
      delete tx.from;
    }

    const serializedTxn = serialize(tx as UnsignedTransaction);
    const unsignedHash = ethers.utils.keccak256(serializedTxn);

    const { r, s, v } = await signHashRSV(
      unsignedHash,
      this.keyId,
      this.regionId
    );

    const signature: SignatureLike = {
      r: '0x' + r,
      s: '0x' + s,
      v: parseInt(v, 16) - 27,
    };

    return serialize(tx as UnsignedTransaction, signature);
  }

  async signMessage(message: Bytes | string): Promise<string> {
    const messageHash = hashMessage(message);
    const { r, s, v } = await signHashRSV(
      messageHash,
      this.keyId,
      this.regionId
    );

    return `0x${r}${s}${v}`;
  }
}
