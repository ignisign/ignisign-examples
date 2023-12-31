import * as _ from 'lodash';
import * as fs from 'fs';
import * as crypto from "crypto";

const ALGORITHM     = 'sha256'
const ENCODING      = 'base64'
type HashDataInput  = string | NodeJS.ReadableStream;

export {
  getFileHash,
  saveFileToFolder,
  deleteFile,
}

async function getFileHash(input: HashDataInput) : Promise<string>{
  if(_.isString(input))
    return crypto.createHash(ALGORITHM).update(<string>input).digest(ENCODING);

  return getHashFromStream(<NodeJS.ReadableStream>input);
}

async function saveFileToFolder(filePath, folderPath, fileName = null) : Promise<string>{
  return new Promise((resolve, reject) => {
    
    const name            = filePath.split('/').pop(); // Extract the file name from the file path
    const destinationPath = `${folderPath}/${fileName ?? name}`;
    const readStream      = fs.createReadStream(filePath);
    const writeStream     = fs.createWriteStream(destinationPath);

    readStream.on('error', reject);
    writeStream.on('error', reject);

    writeStream.on('finish', () => {
      resolve(destinationPath);
    });

    readStream.pipe(writeStream);
  });
}

async function getHashFromStream(input: any): Promise<string> {

  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash(ALGORITHM);

      input.on('error', (err)   => reject(err));
      input.on('data',  (chunk) => hash.update(chunk));
      input.on('end',   ()      => resolve(hash.digest(ENCODING)));

    } catch (e) {
      reject(e);
    }
  });
}

async function deleteFile(filePath) : Promise<void>{
  
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error when deleting file:' + filePath);
        reject(err);

      } else {
        resolve()
      }
    });
  });
}

