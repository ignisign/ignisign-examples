
export type Contract = {
  _id : string;
  signatureRequestId : string;
  signers : {
    ignisignSignerId        : string;
    userId                  : string;
    ignisignSignatureToken ?: string;
    status                  : 'INIT' | 'DONE';
  }[]
}