
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
  _id              ?: string;
  title             : string;
  documents         : BareSignatureDocument[];
  status            : BARE_SIGNATURE_STATUS;
  codeVerifier      : string;
  authorizationUrl ?: string;
  accessToken      ?: string;
}

export class RedirectUrlWrapper {
  redirectUrl: string;
}

