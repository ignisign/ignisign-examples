import { IgnisignDocument_PrivateFileDto } from "@ignisign/public";
import { generateBearerToken } from "../../utils/authorization.middleware";
import { saveFileToFolder } from "../../utils/files.util";
import { MyFile, MyFileModel } from "../../models/file.db.model";
import { MyUser } from "../../models/user.db.model";
import { IgnisignSdkManagerSigantureService } from "../ignisign/ignisign-sdk-manager-signature.service";
import { IgnisignInitializerService } from "../ignisign/ignisign-sdk-initializer.service";
import { findOneCallback, insertCallback } from "./tinydb.utils";


export const FileService = {
  getPrivateFileUrl,
  saveFile,
  getFileByDocumentId,
}


async function getFileByDocumentId(documentId) : Promise<MyFile> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();
  return new Promise((resolve, reject) => {
    MyFileModel.findOne(
      { documentId, ignisignAppId, ignisignAppEnv }, 
      findOneCallback(resolve, reject, true));
  });

}

async function getPrivateFileUrl(documentId) : Promise<IgnisignDocument_PrivateFileDto> {
  
  const __buildFileAccessPath = (documentId: string) => `${process.env.MY_SERVER_URL}/uploads/${documentId}`;

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const myFile : MyFile = await new Promise((resolve, reject) => {
    
    MyFileModel.findOne(
      { documentId, ignisignAppId, ignisignAppEnv }, 
      findOneCallback(resolve, reject, true));

  });

  const privateFileInfo : IgnisignDocument_PrivateFileDto = {
    documentId,
    fileUrl  : __buildFileAccessPath(documentId),
    mimeType : myFile.mimeType,
    fileName : myFile.fileName,
    bearer   : generateBearerToken()
  }

  return privateFileInfo;
}

async function saveFile(fileHash, file, documentId) : Promise<MyFile>{
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();
  
  return new Promise(async (resolve, reject) => {

    const path = await saveFileToFolder(file.path, 'uploads', documentId)

    const data = {
      filePath  : path, 
      mimeType  : file.mimetype,
      fileName  : file.originalname,
      fileHash,
      documentId,
      ignisignAppId, 
      ignisignAppEnv
    }
        
    MyFileModel.insert(data, insertCallback(resolve, reject));
  });
}

