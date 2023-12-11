import { getFileHash } from "../utils/files.util";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";
import * as FormData from "form-data";
import * as fs from 'fs';
import { FileService } from "./files.service";
import { IgnisignSignatureRequest_UpdateDto, IGNISIGN_APPLICATION_ENV, IGNISIGN_DOCUMENT_TYPE } from "@ignisign/public";
import { IgnisignSdkFileContentUploadDto } from "@ignisign/sdk";
import { Contract, ContractContext, ContractModel } from "../models/contract.db.model";
import { UserService } from "./user.service";
import { Readable } from "stream";


/** Promise Related Complexity WARNING : 
 *  Due of a lack  of integration of `Promises` into the `tingodb` library, 
 *  this service implementation below are a little bit complex to abstract this lack of integration to upper level services and controllers.
 **/

export const ContractService = {
  createNewContract,
  
  getContracts,
  getContractContextByUser,

  handleLaunchSignatureRequestWebhook,
  handleFinalizeSignatureWebhook,
  handleSignatureProofWebhook,
  
  downloadSignatureProof,
}


async function createNewContract(customerId: string, sellerId: string, contractFile: any): Promise<void> {  
  
  return new Promise<void>(async (resolve, reject) => {
    try {

      const signatureProfileId  = process.env.IGNISIGN_SIGNATURE_PROFILE_ID
  
      const signatureProfile    = await IgnisignSdkManagerService.getSignatureProfile(signatureProfileId)
      const customer            = await UserService.getUser(customerId)
      const seller              = await UserService.getUser(sellerId)
      const signatureRequestId  = await IgnisignSdkManagerService.initSignatureRequest(signatureProfileId);
  
      // This function is used to handle private files.
      const handlePrivateFile = async (signatureRequestId, contractFile: any): Promise<string> => {
        
        const fileHash      = await getFileHash(fs.createReadStream(contractFile.path)) // calculate the hash of the file
        const documentId    = await IgnisignSdkManagerService.uploadHashDocument(signatureRequestId, fileHash, contractFile.originalname); // upload the hash to Ignisign
        await FileService.saveFile(fileHash, contractFile, documentId) // save the file in the database
      
        return documentId;
      }
      
      // This function is used to handle standard files.
      const handleStandardFile = async (signatureRequestId, contractFile: any): Promise<string> => {
        
        const uploadDto : IgnisignSdkFileContentUploadDto = { // create the DTO to upload the file to Ignisign
          fileStream  : await fs.createReadStream(contractFile.path),
          fileName    : contractFile.originalname,
          contentType : contractFile.mimetype,
        }
        
        return await IgnisignSdkManagerService.uploadDocument(signatureRequestId, uploadDto) // upload the file to Ignisign
      }
  
      const documentId  = signatureProfile.documentTypes.includes(IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE) 
          ? await handlePrivateFile(signatureRequestId, contractFile) 
          : await handleStandardFile(signatureRequestId, contractFile);
  
      const signers = [
        { userId: customerId, ignisignSignerId: customer.signerId },
        { userId: sellerId,   ignisignSignerId: seller.signerId }
      ]
    
      await ContractModel.insert({ signatureRequestId, signers, documentId }, async (error, inserted)=>{
  
        if(error){
          reject(error)
          return;
        }  

        if(!inserted || !inserted.length){
        
          reject(new Error('Contract not created'))
          return;
        }
          
        const contractId = inserted[0]._id.toString();

        const dto : IgnisignSignatureRequest_UpdateDto = {
          documentIds : [documentId],
          signerIds   : [customer.signerId, seller.signerId],
          externalId  : contractId,
          title       : 'Contract'
        };

        await IgnisignSdkManagerService.updateSignatureRequest(signatureRequestId, dto);
        await IgnisignSdkManagerService.publishSignatureRequest(signatureRequestId);
        resolve();
      
      })
  
    } catch (error) {
      throw error
    }
  });
  
}

async function  getContracts(userId): Promise<Contract[]> {
  return new Promise(async (resolve, reject) => {

    await ContractModel.find().toArray((error, contracts) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      const result = contracts?.filter(c => c?.signers?.find(s => s.userId === userId.toString()))
      resolve(result);
    });
  });
}


async function  getContractContextByUser(contractId, userId): Promise<ContractContext> {
  return new Promise(async (resolve, reject) => {

    await ContractModel.findOne({_id: contractId}, async (error, contract) => {
        
      if (error){ 
        reject(error);
        return;
      }

      if(!contract){
        reject(new Error('Contract not found'))
        return;
      }

      const signer  = contract.signers.find(s => s.userId === userId.toString());
      const user    = await UserService.getUser(userId);
      
      resolve({
        signatureRequestId        : contract.signatureRequestId,
        ignisignSignerId          : signer.ignisignSignerId,
        ignisignSignatureToken    : signer.ignisignSignatureToken,
        ignisignUserAuthSecret    : user.ignisignAuthSecret,
        ignisignAppId             : process.env.IGNISIGN_APP_ID,
        ignisignAppEnv            : process.env.IGNISIGN_APP_ENV as IGNISIGN_APPLICATION_ENV,
      })
    });
  });
}

async function  handleLaunchSignatureRequestWebhook(contractId, signatureRequestId, signers): Promise<void> {
  return new Promise<void>(async (resolve, reject) => { 

    const formatedSigners = signers.map( ({ signerId, signerExternalId, token }) => ({
      ignisignSignerId        : signerId,
      ignisignSignatureToken  : token,
      userId                  : signerExternalId,
      status                  : 'INIT'
    }))
  
    await ContractModel.findOne({_id: contractId}, async (error, contract)=>{
      if (error){ 
        reject(error);
        return;
      }

      if(!contract){
        reject(new Error('Contract not found'))
        return;
      }

      const contractToUpdate = {
        documentId  : contract.documentId,
        signers     : formatedSigners,
        signatureRequestId,
      };

       await ContractModel.update(
        {_id: contractId}, 
        contractToUpdate, 
        async (error, updated) => error ? reject(error) : resolve());

    });
  });
}

async function  handleFinalizeSignatureWebhook(contractId, signatureRequestId, userId) : Promise<void> {
  return new Promise<void>(async (resolve, reject) => { 

    await ContractModel.findOne({_id: contractId}, async (error, contract) => {
      if (error){ 
        reject(error);
        return;
      }

      if(!contract){
        reject(new Error('Contract not found'))
        return;
      }
      
      const signers = contract.signers.map( s => {
        if(s.userId === userId)
          s.status = 'DONE';
        
        return s
      })

      const contractToUpdate = {
        documentId: contract.documentId,
        signatureRequestId,
        signers,
      };

      await ContractModel.update(
        {_id: contractId}, 
        contractToUpdate, 
        async (error, updated) => error ? reject(error) : resolve());
    });
  });
}

async function  handleSignatureProofWebhook(contractId, signatureProofUrl) : Promise<void> {
  return new Promise<void>(async (resolve, reject) => { 

    await ContractModel.findOne({_id: contractId}, async (error, contract) => {
      if (error){ 
        reject(error);
        return;
      }

      if(!contract){
        reject(new Error('Contract not found'))
        return;
      }
      
      const contractToUpdate = {
        _id                   : contractId,
        isSignatureProofReady : true,
        signatureRequestId    : contract.signatureRequestId,
        documentId            : contract.documentId,
        signers               : contract.signers,
        signatureProofUrl,
      }

      await ContractModel.update(
        {_id: contractId}, 
        contractToUpdate, 
        async (error, updated) => error ? reject(error) : resolve());

    });
  });
}

async function  downloadSignatureProof(contractId): Promise<Readable> {

  return new Promise(async (resolve, reject) => { 
    try {
      await ContractModel.findOne({_id: contractId}, async (error, contract) => {
        if (error){ 
          reject(error);
          return;
        }
  
        if(!contract){
          reject(new Error('Contract not found'))
          return;
        }

        if(contract.isSignatureProofReady){

          const signatureProof = await IgnisignSdkManagerService.downloadSignatureProof(contract.documentId)
          resolve(signatureProof)
        } else {
          reject(new Error('Signature proof is not ready yet'))
        }
      })
    } catch(e) { reject(e) }
  })
}



