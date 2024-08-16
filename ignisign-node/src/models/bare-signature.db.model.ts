import { getDb } from "../utils/db.util";

const db = getDb()

export enum BARE_SIGNATURE_STATUS {
  INIT       = 'INIT',
  IN_PROGESS = 'IN_PROGESS',
  SIGNED     = 'SIGNED',
}

export type BareSignatureDocument = {
  fileB64      : string;
  fileName     : string;
  mimeType     : string;
  documentHash : string;
}

export type BareSignature = {
  _id              ?: string;
  title             : string;
  document          : BareSignatureDocument;
  status            : BARE_SIGNATURE_STATUS;
  codeVerifier      : string;
  accessToken      ?: string;
  ignisignAppId     : string;
  ignisignAppEnv    : string;
}




export const BareSignatureModel = db.collection("baresignatures");
