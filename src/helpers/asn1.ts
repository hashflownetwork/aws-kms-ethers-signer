import asn1 from 'asn1.js';

export const EcdsaPubKey = asn1.define('EcdsaPubKey', function (this: any) {
  this.seq().obj(
    this.key('algo')
      .seq()
      .obj(this.key('algorithm').objid(), this.key('parameters').objid()),
    this.key('pubKey').bitstr()
  );
});

export const EcdsaSignature = asn1.define('EcdsaSig', function (this: any) {
  this.seq().obj(this.key('r').int(), this.key('s').int());
});
