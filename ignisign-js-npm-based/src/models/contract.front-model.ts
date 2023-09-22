import { IGNISIGN_APPLICATION_ENV } from "@ignisign/public";

export type Contract = {
  _id: string;
  signatureRequestId: string;
  signers: {
    ignisignSignerId: string;
    userId: string;
    ignisignSignatureToken?: string;
    status: 'INIT' | 'DONE';
  }[]
}

export type ContractContext = {
  signatureRequestId: string,
  ignisignSignerId: string,
  ignisignSignatureToken: string,
  ignisignUserAuthSecret: string,
  ignisignAppId: string,
  ignisignAppEnv: IGNISIGN_APPLICATION_ENV,
}