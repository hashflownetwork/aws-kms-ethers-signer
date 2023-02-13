This is an ethers.js compatible Signer that uses AWS KMS. This works for any EVM-compatible chain.

In order to create an Ethereum-compatible key in AWS KMS, select the following options:

- Key Type: Asymmetric
- Key Usage: Sign and Verify
- Key Spec: ECC_SECG_P256K1

Once the key is set up, one can easily instantiate a KMS-based Signer, as such:

```javascript
import { KMSSigner } from '@hashflow/aws-kms-ethers-signer';

const signer = new KMSSigner(regionId, keyId, provider);

await signer.sendTransaction(..);
```

To run tests:

- Populate an `.env` file (see `.env.example`)
- `yarn`
- `yarn test`
