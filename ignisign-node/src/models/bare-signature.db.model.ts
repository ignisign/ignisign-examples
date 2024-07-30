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
  documents         : BareSignatureDocument[];
  status            : BARE_SIGNATURE_STATUS;
  codeVerifier      : string;
  authorizationUrl ?: string;
  accessToken      ?: string;
}

export class IgnisignOAuth2_ProofAccessTokenRequest {
  client_id      : string;
  client_secret  : string;
  code_verifier  : string;
  redirect_uri   : string;
  grant_type     : string;
  code           : string;
}

export class IgnisignOAuth2_ProofAccessToken {
  access_token : string;
  token_type   : string;
  expires_in   : number;
  scope        : string;
}


export const BareSignatureModel = db.collection("baresignatures");
