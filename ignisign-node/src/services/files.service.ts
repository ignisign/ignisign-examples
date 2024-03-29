import { IgnisignDocument_PrivateFileDto } from "@ignisign/public";
import { generateBearerToken } from "../utils/authorization.middleware";
import { saveFileToFolder } from "../utils/files.util";
import { MyFile, MyFileModel } from "../models/file.db.model";
import { MyUser } from "../models/user.db.model";

export const FileService = {
  getPrivateFileUrl,
  saveFile,
  getFileByDocumentId,
}


async function getFileByDocumentId(documentId) : Promise<MyFile> {
  return new Promise((resolve, reject) => {
    MyFileModel.findOne({ documentId }, ( error, myFile: MyFile ) => {
        if (error) {
          console.error(error)
          reject(error);
          return;
        }

        if(!myFile){
          reject(new Error('File not found'))
          return;
        }

        resolve(myFile);
      });
  });

}

async function getPrivateFileUrl(documentId) : Promise<IgnisignDocument_PrivateFileDto> {
  
  const buildFileAccessPath = (documentId: string) => `${process.env.MY_SERVER_URL}/uploads/${documentId}`;

  return new Promise((resolve, reject) => {
    MyFileModel.findOne({ documentId }, ( error, myFile: MyFile ) => {
        if (error) {
          console.error(error)
          reject(error);
          return;
        }

        if(!myFile){
          reject(new Error('File not found'))
          return;
        }

        const privateFileInfo : IgnisignDocument_PrivateFileDto = {
          documentId,
          fileUrl  : buildFileAccessPath(documentId),
          mimeType : myFile.mimeType,
          fileName : myFile.fileName,
          bearer   : generateBearerToken()
        }

        resolve(privateFileInfo);
      });
  });
}

async function saveFile(fileHash, file, documentId) : Promise<MyFile>{
  return new Promise(async (resolve, reject) => {

    const path = await saveFileToFolder(file.path, 'uploads', documentId)
    const data = {
      filePath  : path, 
      mimeType  : file.mimetype,
      fileName  : file.originalname,
      fileHash,
      documentId
    }
        
    MyFileModel.insert(data, async (error, found: MyFile[]) => {
      if (error) {
        console.error(error)
        reject(error);
      } else if(!found || found.length === 0) {
        reject(new Error("File not found"))
        
      } else {
        resolve(found[0]);
      }
    });
  });
}

