
import * as asn1 from 'asn1.js';
import * as elliptic from 'elliptic';
import { saveBufferAsFile } from './files.util';
import * as uuid from "uuid";


export const PKCS7_Utils = {
  getPKCS7contentFromBase64,
}


async function getPKCS7contentFromBase64(pkcs7Base64: string) : Promise<string> {

  const derBuffer = Buffer.from(pkcs7Base64, 'base64');

  const name          = uuid.v4() + '.der';
  const derPath = await saveBufferAsFile(derBuffer, 'uploads', name);
  console.log('derPath : ', derPath);



// Define ASN.1 structure for AlgorithmIdentifier
const AlgorithmIdentifier = asn1.define('AlgorithmIdentifier', function () {
  this.seq().obj(
    this.key('algorithm').objid(),
    this.key('parameters').optional().any()
  );
});


// Define ASN.1 structure for SignerInfo
const SignerInfo = asn1.define('SignerInfo', function () {
  this.seq().obj(
    this.key('version').int(),
    // this.key('sid').choice({
    //   issuerAndSerialNumber: this.seq().obj(
    //     this.key('issuer').any(),
    //     this.key('serialNumber').int()
    //   ),
    //   subjectKeyIdentifier: this.octstr()
    // }),
    // this.key('digestAlgorithm').use(AlgorithmIdentifier),
    // this.key('signedAttrs').implicit(0).optional().any(),
    // this.key('signatureAlgorithm').use(AlgorithmIdentifier),
    // this.key('signature').octstr(),
    // this.key('unsignedAttrs').implicit(1).optional().any()
  );
});


  // Define ASN.1 structure for PKCS7 SignedData
// const SignedData = asn1.define('SignedData', function () {
//   this.seq().obj(
//     // this.key('version').int(),
//     // this.key('digestAlgorithms').seqof(this.use(AlgorithmIdentifier)),
//     // this.key('contentInfo').seq().obj(
//     //   this.key('contentType').objid(),
//     //   this.key('content').explicit(0).optional().any() // EncapContentInfo
//     // ),
//     // this.key('certificates').explicit(0).optional().any(),
//     this.key('crls').explicit(1).optional().any(),
//     // this.key('signer_info').setof(this.use(SignerInfo))
//   );
// });



// Function to parse OID to human-readable names (simplified for this example)
const oidToName = (oid) => {
  const oids = {
    '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
    '1.2.840.10045.4.3.2': 'ecdsaWithSHA256',
    // Add more OIDs as needed
  };
  return oids[oid] || oid;
};

// Decode the PKCS7 SignedData structure
// const signedData = SignedData.decode(derBuffer, 'der');

// console.log("decoded")


// const signedDataJson = {
//   // version: signedData.version,
//   digestAlgorithms: signedData.digestAlgorithms.map((alg) => ({
//     algorithm: oidToName(alg.algorithm.join('.')),
//     parameters: alg.parameters ? alg.parameters.toString('hex') : null,
//   })),
//   contentInfo: {
//     contentType: oidToName(signedData.contentInfo.contentType.join('.')),
//     content: signedData.contentInfo.content ? signedData.contentInfo.content.toString('hex') : null,
//   },
//   certificates: signedData.certificates ? signedData.certificates.toString('hex') : null,
//   crls: signedData.crls ? signedData.crls.toString('hex') : null,
//   signerInfos: signedData.signerInfos.map((signer) => ({
//     // version: signer.version,
//     sid: signer.sid,
//     digestAlgorithm: oidToName(signer.digestAlgorithm.algorithm.join('.')),
//     signatureAlgorithm: oidToName(signer.signatureAlgorithm.algorithm.join('.')),
//     signature: signer.signature.toString('hex'),
//   })),
// };

// console.log(JSON.stringify(signedDataJson, null, 2));

const SignedData = asn1.define('SignedData', function () {
  this.obj(
     this.key('version').int(),
    // this.key('digestAlgorithms').seqof(this.use(AlgorithmIdentifier)),
    // this.key('contentInfo').seq().obj(
    //   this.key('contentType').objid(),
    //   this.key('content').explicit(0).optional().any() // EncapContentInfo
    // ),
    // this.key('certificates').explicit(0).optional().any(),
    // this.key('crls').explicit(1).optional().any(),
    // this.key('signer_info').setof(this.use(SignerInfo))
  );
});


const PKCS7 = asn1.define('PKCS7', function () {
  this.seq().obj(
    this.key('contentType').objid(),
    this.key('content').use(SignedData)
  );
});
  const pkcs7 = PKCS7.decode(derBuffer, 'der');

  console.log('PKCS7 Content Type:', pkcs7.contentType.join('.'));



  if (pkcs7.content) {
    const signedData = pkcs7.content;
    // Handle the signed data content
    console.log('Signed Data:', signedData);
  }

  return '';
}