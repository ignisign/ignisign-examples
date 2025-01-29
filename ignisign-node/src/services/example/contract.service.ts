import { getFileHash } from "../../utils/files.util";
import { IgnisignSdkManagerSignatureService } from "../ignisign/ignisign-sdk-manager-signature.service";
import * as FormData from "form-data";
import * as fs from 'fs';
import { FileService } from "./files.service";
import { IgnisignSignatureRequest_UpdateDto, IGNISIGN_APPLICATION_ENV, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_SIGNATURE_METHOD_REF } from "@ignisign/public";
import { IgnisignSdkFileContentUploadDto } from "@ignisign/sdk";
import { Contract, ContractContext, ContractModel } from "../../models/contract.db.model";
import { UserService } from "./user.service";
import { Readable } from "stream";
import { MyUser } from "../../models/user.db.model";
import _ = require("lodash");
import axios from "axios";
import { IgnisignInitializerService } from "../ignisign/ignisign-sdk-initializer.service";
import { findCallback, findOneCallback, insertCallback } from "./tinydb.utils";

/** Promise Related Complexity WARNING : 
 *  Due of a lack  of integration of `Promises` into the `tingodb` library, 
 *  this service implementation below are a little bit complex to abstract this lack of integration to upper level services and controllers.
 **/

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}


export const ContractService = {
  createNewContract,
  
  getContracts,
  getContractContextByUser,
  getAllContractToSignContexts,

  handleLaunchSignatureRequestWebhook,
  handleFinalizeSignatureWebhook,
  handleSignatureProofWebhook,
  
  downloadSignatureProof,
}

async function createNewContract(customerId: string, employeeId: string, contractFile: any): Promise<void> { 
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();
  
  // This function is used to handle private files.
  const __handlePrivateFile = async (signatureRequestId, contractFile: any): Promise<string> => {
        
    const fileHash      = await getFileHash(fs.createReadStream(contractFile.path)) // calculate the hash of the file
    const documentId    = await IgnisignSdkManagerSignatureService.uploadHashDocument(signatureRequestId, fileHash, contractFile.originalname); // upload the hash to Ignisign
    await FileService.saveFile(fileHash, contractFile, documentId) // save the file in the database
  
    return documentId;
  }

  // This function is used to handle standard files.
  const __handleStandardFile = async (signatureRequestId, contractFile: any): Promise<string> => {
    const uploadDto : IgnisignSdkFileContentUploadDto = { // create the DTO to upload the file to Ignisign
      fileStream  : await fs.createReadStream(contractFile.path),
      fileName    : contractFile.originalname,
      contentType : contractFile.mimetype,
    }
    
    return await IgnisignSdkManagerSignatureService.uploadDocument(signatureRequestId, uploadDto) // upload the file to Ignisign
  }

  try {
    const customer            = await UserService.getUser(customerId);
    const employee            = await UserService.getUser(employeeId);
    const signatureRequestId  = await IgnisignSdkManagerSignatureService.initSignatureRequest();
    //TODO
    const documentId  = await __handleStandardFile(signatureRequestId, contractFile);
    // signatureProfile.documentTypes.includes(IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE) 
    //     ? await __handlePrivateFile(signatureRequestId, contractFile) 
    //     : await __handleStandardFile(signatureRequestId, contractFile);


    const signers = [
      { userId: customerId, ignisignSignerId: customer.signerId },
      { userId: employeeId, ignisignSignerId: employee.signerId }
    ]
    
    const contract : Contract = await new Promise(async (resolve, reject) => {
      await ContractModel.insert(
        { signatureRequestId, signers, documentId, ignisignAppId, ignisignAppEnv }, 
        insertCallback(resolve, reject));
    })
            
    const contractId = contract._id.toString();

    const dto : IgnisignSignatureRequest_UpdateDto = {
      documentIds : [documentId],
      signerIds   : [customer.signerId, employee.signerId],
      externalId  : contractId,
      title       : 'Contract (Simple Signature)',
      
      defaultSignatureMethod: IGNISIGN_SIGNATURE_METHOD_REF.SIMPLE_STD,
    };

    console.log(dto);

    await IgnisignSdkManagerSignatureService.updateSignatureRequest(signatureRequestId, dto);
    await IgnisignSdkManagerSignatureService.publishSignatureRequest(signatureRequestId);

    // console.log('createNewContract_6');


  } catch  (error){
    console.error(error);
    throw error;
  }
}

async function getContracts(userId): Promise<Contract[]> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contracts  : Contract[] = await new Promise(async (resolve, reject) => {
    ContractModel.find({ ignisignAppId, ignisignAppEnv }).toArray(findCallback(resolve, reject));
  });

  return contracts?.filter(c => c?.signers?.find(s => s.userId === userId.toString()))
}

async function getAllContractToSignContexts(): Promise<ContractContext[]> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contracts : Contract[] = await new Promise(async (resolve, reject) => {
    ContractModel.find({ignisignAppId, ignisignAppEnv}).toArray(findCallback(resolve, reject));
  });

  const allUsers : MyUser[] = await UserService.getAllUsers();

  const resultWrapped : ContractContext[][] = contracts.map( c => {

    const resultForAContract : ContractContext[] = c.signers.map( s => {
      const user = allUsers.find( u => u._id.toString() === s.userId)

      if(!user){
        console.error('User not found', s.userId)
        return null;
      }

      if (s.status === 'DONE')
        return null;

      return {
        signatureRequestId        : c.signatureRequestId,
        ignisignAppId,             
        ignisignAppEnv,
        ignisignSignerId          : s.ignisignSignerId,
        ignisignSignatureToken    : s.ignisignSignatureToken,
        ignisignUserAuthSecret    : user.ignisignAuthSecret,
        signerEmail               : user.email,
        documentId                : c.documentId,
      }
      
    })

    return resultForAContract.filter( r => r !== null); 
  })

  return _.flatten(resultWrapped);
}

async function getContractContextByUser(contractId, userId): Promise<ContractContext> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contract : Contract = await new Promise(async (resolve, reject) => {
    ContractModel.findOne({_id: contractId, ignisignAppId, ignisignAppEnv}, findOneCallback(resolve, reject, true))
  });

  const signer  = contract.signers.find(s => s.userId === userId.toString());
  const user    = await UserService.getUser(userId);
  
  return {
    signatureRequestId        : contract.signatureRequestId,
    ignisignSignerId          : signer.ignisignSignerId,
    ignisignSignatureToken    : signer.ignisignSignatureToken,
    ignisignUserAuthSecret    : user.ignisignAuthSecret,
    ignisignAppId,
    ignisignAppEnv,
  }
}

async function handleLaunchSignatureRequestWebhook(contractId, signatureRequestId, signers): Promise<void> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const formatedSigners = signers.map( ({ signerId, signerExternalId, token }) => ({
    ignisignSignerId        : signerId,
    ignisignSignatureToken  : token,
    userId                  : signerExternalId,
    status                  : 'INIT'
  }))

  const contract : Contract = await new Promise(async (resolve, reject) => {
    ContractModel.findOne(
      {_id: contractId, ignisignAppId, ignisignAppEnv}, 
      findOneCallback(resolve, reject, true));
  });

  const contractToUpdate = {
    ...contract,
    signers     : formatedSigners,
    signatureRequestId,
  };

  return await new Promise<void>(async (resolve, reject) => {
    ContractModel.update(
      {_id: contractId, ignisignAppId, ignisignAppEnv}, 
      contractToUpdate, 
      async (error, updated) => error ? reject(error) : resolve());
    });
  
}

async function handleFinalizeSignatureWebhook(contractId, signatureRequestId, userId) : Promise<void> {

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contract : Contract = await new Promise(async (resolve, reject) => { 
    ContractModel.findOne(
      {_id: contractId, ignisignAppId, ignisignAppEnv}, 
      findOneCallback(resolve, reject, true));
  });

  const signers = contract.signers.map( s => {
    if(s.userId === userId)
      s.status = 'DONE';
    
    return s
  })

  const contractToUpdate = {
    ...contract,
    documentId: contract.documentId,
    signatureRequestId,
    signers,
  };

  return new Promise<void>(async (resolve, reject) => { 
    ContractModel.update(
        {_id: contractId, ignisignAppId, ignisignAppEnv}, 
        contractToUpdate, 
        async (error, updated) => error ? reject(error) : resolve());
    });
}

async function handleSignatureProofWebhook(contractId, signatureProofUrl) : Promise<void> {

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contract : Contract = await new Promise(async (resolve, reject) => { 
    ContractModel.findOne(
      {_id: contractId, ignisignAppId, ignisignAppEnv}, 
      findOneCallback(resolve, reject, true));
  });

  const contractToUpdate = {
    ...contract,
    _id                   : contractId,
    isSignatureProofReady : true,
    signatureRequestId    : contract.signatureRequestId,
    documentId            : contract.documentId,
    signers               : contract.signers,
    signatureProofUrl,
  }


  return new Promise<void>(async (resolve, reject) => { 
    ContractModel.update(
        {_id: contractId, ignisignAppId, ignisignAppEnv}, 
        contractToUpdate, 
        async (error, updated) => error ? reject(error) : resolve());
  });
}

async function downloadSignatureProof(contractId): Promise<Readable> {

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const contract : Contract = await new Promise(async (resolve, reject) => { 
    ContractModel.findOne(
      {_id: contractId, ignisignAppId, ignisignAppEnv}, 
      findOneCallback(resolve, reject, true));
  });

  if(!contract.isSignatureProofReady)
    throw new Error('Signature proof is not ready yet')

    
  _logIfDebug('contract', contract);
  
  const signatureRequestContext = await IgnisignSdkManagerSignatureService.getSignatureRequestContext(contract.signatureRequestId);

  if(!signatureRequestContext)
    throw new Error("Cannot find signature request context with id : " + contract.signatureRequestId)

  const maybeDocument = signatureRequestContext.documents.find(d => d._id === contract.documentId);

  if(!maybeDocument)
    throw new Error("Cannot find document with id : " + contract.documentId)

  if(maybeDocument.documentNature !== IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE)
    return await IgnisignSdkManagerSignatureService.downloadSignatureProof(contract.documentId);

  if (!process.env.IGNISIGN_PRIVATE_PROOF_GENERATOR_URL)
    return await IgnisignSdkManagerSignatureService.downloadSignatureProof(contract.documentId);

  // This is the URL of the private proof generator module
  // This is a module that is used to generate the proof of signature of a private file
  // Obtaining this module needs to be done through a commercial agreement with Ignisign
  // If you are interested in this module, please contact us at contact@ignisign.io

  _logIfDebug("Using private proof generator module")

  const url = `${process.env.IGNISIGN_PRIVATE_PROOF_GENERATOR_URL}/v1/signature-requests/${contract.signatureRequestId}/documents/${contract.documentId}/signature-proof`;
  const localFile = await FileService.getFileByDocumentId(contract.documentId);

  if(!localFile)
    throw new Error('Cannot find local file')
  
  _logIfDebug(localFile)
  const formData = new FormData();

  formData.append('file', await fs.createReadStream(localFile.filePath), {
    filename    : localFile.fileName,
    contentType : localFile.mimeType
  });

  const { data } = await axios.post(url, formData, {
    headers : { ...formData.getHeaders() },
    responseType: 'stream'
  })
  return data;
      
}



