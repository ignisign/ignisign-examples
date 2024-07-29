
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

export class RedirectUrlWrapper {
  redirectUrl: string;
}