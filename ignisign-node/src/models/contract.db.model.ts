
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { getDb } from '../utils/db.util';

const db = getDb()

export type Contract = {
  _id                   ?: string;
  signatureRequestId    ?: string;
  documentId            ?: string;
  isSignatureProofReady ?: boolean;
  signatureProofUrl     ?: string;
  signers?: {
    ignisignSignerId        ?: string;
    userId                  ?: string;
    ignisignSignatureToken  ?: string;
    status                  ?: 'INIT' | 'DONE';
  }[]
}

export type ContractContext = {
  signatureRequestId      : string,
  ignisignSignerId        : string,
  ignisignSignatureToken  : string,
  ignisignUserAuthSecret  : string,
  ignisignAppId           : string,
  ignisignAppEnv          : IGNISIGN_APPLICATION_ENV,
}

export const ContractModel   = db.collection("contracts");
