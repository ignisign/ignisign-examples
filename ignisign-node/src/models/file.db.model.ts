
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { getDb } from '../utils/db.util';

const db = getDb()

export type MyFile = {
  filePath    : string;
  fileHash    : string;
  mimeType    : string;
  fileName    : string;
  documentId  : string;
  ignisignAppId       ?: string;
  ignisignAppEnv      ?: IGNISIGN_APPLICATION_ENV;
}

export const MyFileModel = db.collection("files");
