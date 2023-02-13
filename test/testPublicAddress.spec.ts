import { expect } from 'chai';
import dotenv from 'dotenv';
import { KMSSigner } from 'signer/KMSSigner';

dotenv.config();

describe('Public Address', () => {
  it('should retrieve KMS config from environment', () => {
    if (!process.env.TEST_KMS_REGION_ID) {
      throw new Error('Could not find KMS Region ID.');
    }

    if (!process.env.TEST_KMS_KEY_ID) {
      throw new Error('Could not find KMS Key ID.');
    }
  });

  it('should get Public Address', async () => {
    const signer = new KMSSigner(
      process.env.TEST_KMS_REGION_ID!,
      process.env.TEST_KMS_KEY_ID!
    );

    const address = await signer.getAddress();

    expect(address.length).to.equal(20 * 2 + 2);
  });
});
