import { expect } from 'chai';
import dotenv from 'dotenv';
import { utils } from 'ethers';
import { KMSSigner } from 'signer/KMSSigner';

dotenv.config();

describe('Message Signing', () => {
  it('should get sign a message', async () => {
    const signer = new KMSSigner(
      process.env.TEST_KMS_REGION_ID!,
      process.env.TEST_KMS_KEY_ID!
    );

    const testMessage = 'test';
    const publicAddress = await signer.getAddress();

    const signature = await signer.signMessage(testMessage);

    const eip191Hash = utils.solidityKeccak256(
      ['string', 'string'],
      ['\x19Ethereum Signed Message:\n4', testMessage]
    );

    const recoveredAddress = utils.recoverAddress(eip191Hash, signature);

    expect(recoveredAddress.toLowerCase()).to.equal(
      publicAddress.toLowerCase()
    );
  });
});
