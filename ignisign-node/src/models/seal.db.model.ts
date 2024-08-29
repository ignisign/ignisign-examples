
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { getDb } from '../utils/db.util';

const db = getDb()

export type Seal = {
  _id                     ?: string;
  signatureRequestId      ?: string;
  type                   ?: 'M2M' | 'MANUAL';
  status                 ?: 'INIT' | 'CREATED' | 'DONE';
  title                  ?: string;
  ignisignSignerId        ?: string;
  ignisignSignatureToken  ?: string;
}
  // documentId            ?: string;
  // isSignatureProofReady ?: boolean;
  // signatureProofUrl     ?: string;
  // ignisignAppId         ?: string;
  // ignisignAppEnv        ?: IGNISIGN_APPLICATION_ENV;
  // signers?: {
  //   ignisignSignerId        ?: string;
  //   userId                  ?: string;
  //   ignisignSignatureToken  ?: string;
  //   status                  ?: 'INIT' | 'DONE';
  // }[]
// }

// export type ContractContext = {
//   signatureRequestId      : string,
//   ignisignSignerId        : string,
//   ignisignSignatureToken  : string,
//   ignisignUserAuthSecret  : string,
//   ignisignAppId           : string,
//   ignisignAppEnv          : IGNISIGN_APPLICATION_ENV,
//   signerEmail            ?: string,
//   documentId             ?: string,
// }

// await new Promise(async (resolve, reject) => {
//   ContractModel.findOne({_id: contractId, ignisignAppId, ignisignAppEnv}, findOneCallback(resolve, reject, true))
// });

export const SealModel   = db.collection("seals");
