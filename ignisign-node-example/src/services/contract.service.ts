import { getFileHash } from "../utils/files.util";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";
import * as FormData from "form-data";
import * as fs from 'fs';
import { FileService } from "./files.service";
import { IgnisignSignatureRequest_UpdateDto, IGNISIGN_DOCUMENT_TYPE } from "@ignisign/public";
import { IgnisignSdkFileContentUploadDto } from "@ignisign/sdk";
import { ContractModel } from "../models/contract.db.model";
import { UserService } from "./user.service";

const handlePrivacyContract = async (signatureRequestId, contractFile: any) => {
  const fileHash = await getFileHash(fs.createReadStream(contractFile.path))
  const documentId = await IgnisignSdkManagerService.uploadHashDocument(signatureRequestId, fileHash, contractFile.originalname)
  await FileService.saveFile(fileHash, contractFile, documentId)
  return documentId
}

const handleStandardFile = async (signatureRequestId, contractFile: any) => {
  const formData = new FormData();
  
  formData.append('file', await fs.createReadStream(contractFile.path), {
    filename: contractFile.originalname,
    contentType: contractFile.mimetype
  });

  const uploadDto : IgnisignSdkFileContentUploadDto = {
    fileStream  : await fs.createReadStream(contractFile.path),
    filename    : contractFile.originalname,
    contentType : contractFile.mimetype
  }

  const documentId = await IgnisignSdkManagerService.uploadDocument(signatureRequestId, uploadDto)
  return documentId
}

const createNewContract = async (customerId: string, sellerId: string, contractFile: any) => {  
  try {
    const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID
    const signatureProfile = await IgnisignSdkManagerService.getSignatureProfile(signatureProfileId)
    const customer = await UserService.getUser(customerId)
    const seller = await UserService.getUser(sellerId)
    
    const signatureRequestId  = await IgnisignSdkManagerService.initSignatureRequest(signatureProfileId);
    const documentIds         = [
      signatureProfile.documentTypes.includes(IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE) ? 
        await handlePrivacyContract(signatureRequestId, contractFile) 
        : await handleStandardFile(signatureRequestId, contractFile)
    ];

    const signers = [
      {userId: customerId, ignisignSignerId: customer.signerId},
      {userId: sellerId, ignisignSignerId: seller.signerId}
    ]
  
    ContractModel.insert({signatureRequestId, signers}, async (error, found)=>{
      if(found && found.length){
        const dto : IgnisignSignatureRequest_UpdateDto = {
          documentIds,
          signerIds: [customer.signerId, seller.signerId],
          externalId : found[0]._id.toString()
        };

        await IgnisignSdkManagerService.updateSignatureRequest(signatureRequestId, dto);
        await IgnisignSdkManagerService.publishSignatureRequest(signatureRequestId);
      }
    })
  } catch (error) {
    throw error
  }
}

const getContracts = async (userId) => {
  return new Promise((resolve, reject) => {
    ContractModel.find().toArray((error, found) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(found?.filter(e=>e?.signers?.find(e=>{
          return e.userId === userId
        })));
      }
    });
  });
}

const getContractContextByUser = async (contractId, userId) => {
  return new Promise((resolve, reject) => {
    ContractModel.findOne({_id: contractId}, async (error, contract) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        const signer = contract.signers.find(e=>e.userId === userId.toString());
        const user = await UserService.getUser(userId);
        
        resolve({
          signatureRequestId: contract.signatureRequestId,
          ignisignSignerId: signer.ignisignSignerId,
          ignisignSignatureToken: signer.ignisignSignatureToken,
          ignisignUserAuthSecret: user.ignisignAuthSecret,
          ignisignAppId: process.env.IGNISIGN_APP_ID,
          ignisignAppEnv: process.env.IGNISIGN_APP_ENV,

        })
      }
    });
  });
}

const handleLaunchSignatureRequestWebhook = async (contractId, signatureRequestId, signers) => {
  const formatedSigners = signers.map(({signerId, signerExternalId, token})=>({
    ignisignSignerId: signerId,
    ignisignSignatureToken: token,
    userId: signerExternalId,
    status: 'INIT'
  }))

  await ContractModel.update({_id: contractId}, {
    // _id: contractId,
    signatureRequestId,
    signers: formatedSigners,
  }, async (error, found)=>{
    console.info('handleLaunchSignatureRequestWebhook', error, found);
  });
}

const handleFinalizeSignatureWebhook = async (contractId, signatureRequestId, userId) => {

  await ContractModel.findOne({_id: contractId}, async (error, found)=>{
    const contract = found
    
    const signers = contract.signers.map(e=>{
      if(e.userId === userId){
        e.status = 'DONE'
      }
      return e
    })
    await ContractModel.update({_id: contractId}, {
      signatureRequestId,
      signers,
    }, async (error, found)=>{
      console.info('handleFinalizeSignatureWebhook', error, found);
    });
  });
}

export const ContractService = {
  createNewContract,
  getContracts,
  handleLaunchSignatureRequestWebhook,
  getContractContextByUser,
  handleFinalizeSignatureWebhook
}
