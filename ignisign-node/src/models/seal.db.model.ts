
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { getDb } from '../utils/db.util';

const db = getDb()

export type Seal = {
  _id                     ?: string;
  signatureRequestId      ?: string;
  type                    ?: 'M2M' | 'MANUAL';
  status                  ?: 'INIT' | 'CREATED' | 'DONE';
  title                   ?: string;
  ignisignSignerId        ?: string;
  ignisignSignatureToken  ?: string;
  ignisignAppId           ?: string;
  ignisignAppEnv          ?: IGNISIGN_APPLICATION_ENV;
}

export const SealModel   = db.collection("seals");
