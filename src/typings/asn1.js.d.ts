declare module 'asn1.js' {
  type Decoder = {
    decode(buf: Buffer, encodingType: string): any;
  };
  export function define(
    schemaName: string,
    schemaFunction: (definer: any) => any
  ): Decoder;
}
