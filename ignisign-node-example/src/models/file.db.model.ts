
import { getDb } from '../utils/db.util';

const db = getDb()

export type MyFile = {
  filePath : string;
  fileHash : string;
  mimeType : string;
  fileName : string;
}

export const MyFileModel = db.collection("files");
