
import {
  IGNISIGN_APPLICATION_ENV, 
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST, 
  IGNISIGN_SIGNER_CREATION_INPUT_REF, 
  IGNISIGN_WEBHOOK_MESSAGE_NATURE, 
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE,
  IgnisignDocument_InitializationDto, 
  IgnisignSignatureProfile, 
  IgnisignSignatureRequest_Context, 
  IgnisignSignatureRequest_UpdateDto, 
  IgnisignSigner_CreationRequestDto, 
  IgnisignSigner_CreationResponseDto, 
  IgnisignSignatureRequest_IdContainer,
  IgnisignWebhook_ActionDto, 
  IgnisignWebhook,
  IgnisignWebhookDto_SignatureRequest,
  IgnisignWebhookDto_Signature,
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF,
  IgnisignWebhookDto_SignatureProof_Success,
  IgnisignWebhook_CallbackParams,
  IGNISIGN_DOCUMENT_TYPE,
} from '@ignisign/public';
import { IgnisignSdk, IgnisignSdkFileContentUploadDto } from '@ignisign/sdk';
import { Readable } from 'stream';
import { ContractService } from './contract.service';
import _ = require('lodash');
import axios from 'axios';


const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}

let ignisignSdkInstance: IgnisignSdk = null;
let ignisignSdkInstanceInitialized = false;

export const IgnisignSdkManagerService = {
  init,
  createNewSigner,
  revokeSigner,
  consumeWebhook,
  updateSignatureRequest,
  publishSignatureRequest,
  getSignatureProfiles,
  initSignatureRequest,
  uploadHashDocument,
  uploadDocument,
  getSignatureProfileSignerInputsConstraints,
  getSignatureRequestContext,
  getSignatureProfile,
  getWebhookEndpoints,
  downloadSignatureProof,
}

const IGNISIGN_APP_ID     = process.env.IGNISIGN_APP_ID
const IGNISIGN_APP_ENV: IGNISIGN_APPLICATION_ENV = IGNISIGN_APPLICATION_ENV[process.env.IGNISIGN_APP_ENV]
const IGNISIGN_APP_SECRET = process.env.IGNISIGN_APP_SECRET

/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

async function init() {
  _logIfDebug("IgnisignSdkManagerService: init")
  
  if(!IGNISIGN_APP_ID || !IGNISIGN_APP_ENV || !IGNISIGN_APP_SECRET)
    throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_SECRET are mandatory to init IgnisignSdkManagerService`);
    
  try {
    if(ignisignSdkInstanceInitialized)
      return;

    ignisignSdkInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkInstance = new IgnisignSdk({
      appId           : IGNISIGN_APP_ID,
      appEnv          : (<IGNISIGN_APPLICATION_ENV>IGNISIGN_APP_ENV),
      appSecret       : IGNISIGN_APP_SECRET,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
    await _registerWebhookCallback();

  
  } catch (e){
    ignisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** WEBHOOKS *********************************************************************************/
/******************************************************************************************** ******************************************************************************************/


// Registration of webhooks handlers when whe initialize the Ignisign SDK.
async function _registerWebhookCallback(): Promise<void> {
  _logIfDebug("_registerWebhookCallback")

  // The callback function is called when a webhook is received about the lauch of a signature request
  const webhookHandler_LaunchSignatureRequest = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureRequest>): Promise<void> => {
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_LaunchSignatureRequest ERROR : ", error);
      return;
    }

    const { signatureRequestExternalId, signatureRequestId, signers } = content as IgnisignWebhookDto_SignatureRequest;

    _logIfDebug("webhookHandler_LaunchSignatureRequest", {signatureRequestExternalId, signatureRequestId, signers})

    if(signers)
      await ContractService.handleLaunchSignatureRequestWebhook(signatureRequestExternalId, signatureRequestId, signers)
  }

  
  await ignisignSdkInstance.registerWebhookCallback_SignatureRequest(     // Registering the webhookHandler_LaunchSignatureRequest callback function
    webhookHandler_LaunchSignatureRequest, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST.LAUNCHED);


  // The callback function is called when a webhook is received when a signature has been finalized
  const webhookHandler_signatureFinalized = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_Signature>): Promise<void> => {
    
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_signatureFinalized ERROR : ", error);
      return;
    }
    const {signatureRequestExternalId, signatureRequestId, signerExternalId} = content as IgnisignWebhookDto_Signature;

    _logIfDebug("webhookHandler_signatureFinalized", {signatureRequestExternalId, signatureRequestId, signerExternalId})

    await ContractService.handleFinalizeSignatureWebhook(signatureRequestExternalId, signatureRequestId, signerExternalId)
  }

  
  await ignisignSdkInstance.registerWebhookCallback_Signature(    // Registering the webhookHandler_signatureFinalized callback function
    webhookHandler_signatureFinalized, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE.FINALIZED);
  

  // The callback function is called when a webhook is received when a signature proof has been generated
  const webhookHandler_SignatureProofGenerated = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureProof_Success>): Promise<void> => {
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_SignatureProofGenerated ERROR : ", error);
      return;
    }
    const { signatureRequestExternalId, signatureProofUrl } = content as IgnisignWebhookDto_SignatureProof_Success;

    _logIfDebug("webhookHandler_SignatureProofGenerated", {signatureRequestExternalId, signatureProofUrl})

    await ContractService.handleSignatureProofWebhook(signatureRequestExternalId, signatureProofUrl)
  }

  
  await ignisignSdkInstance.registerWebhookCallback_SignatureProof(   // Registering the webhookHandler_SignatureProofGenerated callback function
    webhookHandler_SignatureProofGenerated, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF.GENERATED);

  await checkWebhookEndpoint();
}




// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint() : Promise<void>{
  
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();
    if(webhookEndpoints.length === 0)
      console.warn("WARN: No webhook endpoints found, please create one in the Ignisign Console - In dev mode, you can use ngrok to expose your localhost to the internet")

  } catch(e) {
    console.error("IgnisignSdkManagerService: Error when checking webhook endpoint", e)
    throw e
  }
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints() : Promise<IgnisignWebhook[]>{
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();

    _logIfDebug("getWebhookEndpoints", webhookEndpoints)

    return webhookEndpoints;
  } catch(e) {
    console.error("IgnisignSdkManagerService: Error when checking webhook endpoint", e)
    throw e
  } 
}


// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  _logIfDebug("consumeWebhook", actionDto)
  return await ignisignSdkInstance.consumeWebhook(actionDto);
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE PROFILES ***********************************************************************/
/******************************************************************************************** ******************************************************************************************/

async function getSignatureProfiles(): Promise<IgnisignSignatureProfile[]> {  
  return await ignisignSdkInstance.getSignatureProfiles()
}


async function getSignatureProfile(signatureProfileId): Promise<IgnisignSignatureProfile> {
  try {
    const profiles = await ignisignSdkInstance.getSignatureProfiles()
    const profile  = profiles?.find(p => p._id === signatureProfileId)
    
    if(!profile)
      throw new Error("Cannot find signature profile with id : " + signatureProfileId)
    return profile;

  } catch (e){
    console.error("IgnisignSdkManagerService: Error when retieveing signature profile", e)
    throw e
  }
}


async function getSignatureProfileSignerInputsConstraints(signatureProfileId: string): Promise<IGNISIGN_SIGNER_CREATION_INPUT_REF[]> {
  const result = await ignisignSdkInstance.getSignatureProfileSignerInputsConstraints(signatureProfileId);
  return result.inputsNeeded;
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNERS **********************************************************************************/
/******************************************************************************************** ******************************************************************************************/

async function createNewSigner(signatureProfileId, inputs: { [key in IGNISIGN_SIGNER_CREATION_INPUT_REF] ?: string } = {}, externalId: string = null): Promise<IgnisignSigner_CreationResponseDto> {  

  const dto : IgnisignSigner_CreationRequestDto = {
    signatureProfileId,
    ...inputs,
    ...(externalId && {externalId})
  }

  _logIfDebug("createNewSigner", dto)
  try {
    return await ignisignSdkInstance.createSigner(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function revokeSigner(signerId: string) : Promise<{signerId : string}> {
  return await ignisignSdkInstance.revokeSigner(signerId);
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE REQUEST & DOCUMENTS ***********************************************************/
/******************************************************************************************** ******************************************************************************************/

// This function is used to initialize a signature request.
// See the Ignisign SDK documentation for more information about the global signature request creation process.
async function initSignatureRequest(signatureProfileId: string): Promise<string>{
  _logIfDebug("initSignatureRequest", signatureProfileId)
  const { signatureRequestId } = await ignisignSdkInstance.initSignatureRequest({ signatureProfileId })
  return signatureRequestId
}



async function updateSignatureRequest(signatureRequestId : string, dto: IgnisignSignatureRequest_UpdateDto): Promise<IgnisignSignatureRequest_Context> {
  try {
    _logIfDebug("updateSignatureRequest", {signatureRequestId, dto})
    const data = await ignisignSdkInstance.updateSignatureRequest(signatureRequestId, dto);
    return data
  } catch (error) {
    throw error;
  }
}

async function publishSignatureRequest(signatureRequestId : string) : Promise<IgnisignSignatureRequest_IdContainer>{
  try {
    _logIfDebug("publishSignatureRequest", signatureRequestId)
    const data = await ignisignSdkInstance.publishSignatureRequest(signatureRequestId);
    return data
  } catch (error) {
    throw error;
    
  }
}

// Retrieve the context(all related information) related to a signature request
async function getSignatureRequestContext(signatureRequestId: string): Promise<IgnisignSignatureRequest_Context> {
  _logIfDebug("getSignatureRequestContext", signatureRequestId)
  return await ignisignSdkInstance.getSignatureRequestContext(signatureRequestId);
}

// Upload a hash of a document to Ignisign related to private files.
async function uploadHashDocument(signatureRequestId, fileHash, label): Promise<string> {
  _logIfDebug("uploadHashDocument", {signatureRequestId, fileHash, label})

  const dto : IgnisignDocument_InitializationDto = { signatureRequestId, label };

  const { documentId } = await ignisignSdkInstance.initializeDocument(dto)
  await ignisignSdkInstance.provideDocumentContent_PrivateContent(documentId, fileHash)
  return documentId 
}

// Upload a document to Ignisign related to standard files.
async function uploadDocument(signatureRequestId, uploadDto : IgnisignSdkFileContentUploadDto): Promise<string>{
  _logIfDebug("uploadDocument", {signatureRequestId, fileName : uploadDto.fileName, contentType : uploadDto.contentType})

  const dto : IgnisignDocument_InitializationDto = { signatureRequestId };
  const { documentId } = await ignisignSdkInstance.initializeDocument(dto);

  await ignisignSdkInstance.provideDocumentContent_File(documentId, uploadDto)
  return documentId
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE PROOFS *************************************************************************/
/******************************************************************************************** ******************************************************************************************/

// Retrieve the signature proof of a signature
async function downloadSignatureProof(documentId): Promise<Readable> {
  _logIfDebug("downloadSignatureProof", documentId)
  return await ignisignSdkInstance.downloadSignatureProofDocument(documentId);
}












