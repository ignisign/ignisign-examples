
import { getDb } from '../utils/db.util';

const db = getDb()

export type Contract = {
  _id                   ?: string;
  signatureRequestId    ?: string;

  signers?: {
    ignisignSignerId        ?: string;
    userId                  ?: string;
    ignisignSignatureToken  ?: string;
  }[]
}

export const ContractModel   = db.collection("contracts");
