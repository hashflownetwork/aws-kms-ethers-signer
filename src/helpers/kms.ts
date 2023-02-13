import { KMSClient } from '@aws-sdk/client-kms';

const kmsClientByRegion: { [key: string]: KMSClient } = {};

export function getKMSClient(regionId: string): KMSClient {
  if (kmsClientByRegion[regionId]) {
    return kmsClientByRegion[regionId]!;
  }

  let kms = undefined;
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    kms = new KMSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: regionId,
    });
  } else {
    kms = new KMSClient({
      region: regionId,
    });
  }
  kmsClientByRegion[regionId] = kms;

  return kms;
}
