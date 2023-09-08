import { IgnisignWebhookDto_SignatureRequest, IgnisignError, IgnisignSignatureRequest_UpdateDto,
  IGNISIGN_WEBHOOK_TOPICS,  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST,  IGNISIGN_WEBHOOK_MESSAGE_NATURE } from '@ignisign/public';
import * as FormData from "form-data";
import * as fs from 'fs';

import { getFileHash } from "../utils/files.util";
import { FileService } from "./files.service";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";

import { IgnisignSdkFileContentUploadDto } from "@ignisign/sdk";
import { MySignatureRequest, MySignatureRequestModel, MySignatureRequestSignersModel } from "../models/signature-request.db.model";
import { MyUser, MyUserModel } from "../models/user.db.model";

const addSignatureRequest = async (signatureProfileId, signatureRequest: MySignatureRequest) : Promise<MySignatureRequest> => {
  return new Promise((resolve, reject) => {
    MySignatureRequestModel.insert({...signatureRequest, signatureProfileId}, async (error, found)=>{
      if (error) {
        console.error("addSignatureRequest ERROR : ", error);
        reject(error);
      } else {
        resolve(found[0]);
      }
    });
  });
}

const getSignatureRequests = async (signatureProfileId) => {
  return new Promise((resolve, reject) => {
    MySignatureRequestModel.find({signatureProfileId}).toArray((error, found) => {
      if (error) {
        console.error("getSignatureRequests ERROR : ", error);
        reject(error);
      } else {
        resolve(found);
      }
    });
  });
}

const getSignatureRequest = async (signatureRequestId: string) : Promise<MySignatureRequest> => {
  return new Promise((resolve, reject) => {
    MySignatureRequestModel.findOne({ _id : signatureRequestId }, (error, found) => {
      if (error) {
        console.error("getSignatureRequests ERROR : ", error);
        reject(error);
      } else {
        resolve(found);
      }
    });
  });

}

const getSignatureRequestsSigners = async (signatureRequestId) => {
  return new Promise((resolve, reject) => {
    MySignatureRequestSignersModel.findOne({mySignatureRequestId : signatureRequestId}, (error, found) => {
      if (error) {
        console.error("getSignatureRequestsSigners ERROR : ", error);
        reject(error);
      } else {
        resolve(found);
      }
    });
  });
}

const getUsers = (usersIds): Promise<MyUser[]> => {
  return new Promise((resolve, reject) => {
    MyUserModel.find({_id: {$in: usersIds}}).toArray(async (error, found: MyUser[]) => {
      if (error) {
        reject(error);
      } else {
        resolve(found);
      }
    });
  });
}

const createNewSignatureRequest = async (signatureProfileId, title, files: {file, fullPrivacy: boolean}[], usersIds) => {
  const users: MyUser[]     = await getUsers(usersIds);
  const signatureRequestId  = await IgnisignSdkManagerService.initSignatureRequest(signatureProfileId);
  const documentIds         = [];

  const mySignatureRequest = await addSignatureRequest(
    signatureProfileId,
    { title, signatureRequestId: signatureRequestId }
  );

  for (const {file, fullPrivacy} of files) {
    let documentId = null;

    if(fullPrivacy){
      const fileHash = await getFileHash(fs.createReadStream(file.path))
      documentId = await IgnisignSdkManagerService.uploadHashDocument(signatureRequestId, fileHash, file.originalname)
      await FileService.saveFile(fileHash, file, documentId)

    } else {
      const formData = new FormData();
      formData.append('file', await fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
      });

      const uploadDto : IgnisignSdkFileContentUploadDto = {
        fileStream  : await fs.createReadStream(file.path),
        filename    : file.originalname,
        contentType : file.mimetype
      }

      documentId = await IgnisignSdkManagerService.uploadDocument(signatureRequestId, uploadDto)
    }
    documentIds.push(documentId)
  }

  const dto : IgnisignSignatureRequest_UpdateDto = {
    title, 
    documentIds,
    signerIds : users.map(e => e.signerId),
    externalId : mySignatureRequest._id.toString()
  };

  await IgnisignSdkManagerService.updateSignatureRequest(signatureRequestId, dto);
  await IgnisignSdkManagerService.publishSignatureRequest(signatureRequestId);
}

const handleSignatureRequestWebhookSigners = async (
    content     : IgnisignWebhookDto_SignatureRequest,
    error       : IgnisignError = null,
    msgNature  ?: IGNISIGN_WEBHOOK_MESSAGE_NATURE,
    action     ?: IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST,
    topic      ?: IGNISIGN_WEBHOOK_TOPICS
  ): Promise<any> => {

  // if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
  //   // TODO
  //   return;
  // }

  console.log('handleSignatureRequestWebhookSigners : msgNature', msgNature);

  const {signers, externalId, signatureRequestId} = content;

  const formatedSigners = signers.map(({signerId, externalId, token})=>({
    signerId,
    token,
    myUserId: externalId,
  }))


  MySignatureRequestSignersModel.insert({
    signers               : formatedSigners,
    mySignatureRequestId  : externalId,
    signatureRequestId    : signatureRequestId
  }, async (error, found)=>{
    console.info('Done');
  });
}

export const SignatureRequestService = {
  createNewSignatureRequest,
  handleSignatureRequestWebhookSigners,
  getSignatureRequests,
  getSignatureRequestsSigners,
  getSignatureRequest
}