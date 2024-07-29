import { getDb } from "../utils/db.util";

const db = getDb()

export enum BARE_SIGNATURE_STATUS {
  INIT       = 'INIT',
  IN_PROGESS = 'IN_PROGESS',
  SIGNED     = 'SIGNED',
}

export type BareSignatureDocument = {
  documentPath: string;
  documentHash: string;
}

export type BareSignature = {
  _id          ?: string;
  documents     : BareSignatureDocument[];
  accessToken   : string;
  status        : BARE_SIGNATURE_STATUS;
}


export const BareSignatureModel = db.collection("baresignatures");
