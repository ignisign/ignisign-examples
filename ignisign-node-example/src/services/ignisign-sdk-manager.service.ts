
import {
  IGNISIGN_APPLICATION_ENV, 
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST, 
  IGNISIGN_SIGNER_CREATION_INPUT_REF, 
  IGNISIGN_WEBHOOK_MESSAGE_NATURE, 
  IGNISIGN_WEBHOOK_TOPICS, 
  IGNISIGN_WEBHOOK_ACTION_ALL,
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE,
  IGNISIGN_WEBHOOK_ACTION_SIGNER,
  IGNISIGN_WEBHOOK_ACTION_DOCUMENT,
  IgnisignError,
  IgnisignDocument_InitializationDto, 
  IgnisignSignatureProfile, 
  IgnisignSignatureRequest_Context, 
  IgnisignSignatureRequest_UpdateDto, 
  IgnisignSigner_CreationRequestDto, 
  IgnisignSigner_CreationResponseDto, 
  IgnisignSignatureRequest_IdContainer,
  IgnisignWebhook_ActionDto, 
  IgnisignWebhook_Action,
  IgnisignWebhookDto,
  IgnisignWebhook,
} from '@ignisign/public';
import { IgnisignSdk, IgnisignSdkFileContentUploadDto } from '@ignisign/sdk';
import { SignatureRequestService } from './signature-request.service';

let ignisignSdkInstance: IgnisignSdk = null;

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
  getSignatureRequestContext
}

const IGNISIGN_APP_ID     = process.env.IGNISIGN_APP_ID
const IGNISIGN_APP_ENV: IGNISIGN_APPLICATION_ENV = IGNISIGN_APPLICATION_ENV[process.env.IGNISIGN_APP_ENV]
const IGNISIGN_APP_SECRET = process.env.IGNISIGN_APP_SECRET

async function init() {
  
  if(!IGNISIGN_APP_ID || !IGNISIGN_APP_ENV || !IGNISIGN_APP_SECRET)
    throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_SECRET are mandatory to init IgnisignSdkManagerService`);
    
  try {
    ignisignSdkInstance = new IgnisignSdk({
      appId           : IGNISIGN_APP_ID,
      appEnv          : (<IGNISIGN_APPLICATION_ENV>IGNISIGN_APP_ENV),
      appSecret       : IGNISIGN_APP_SECRET,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
    
    const exampleWebhookCallback = async ( 
      webhookContext  : IgnisignWebhookDto, 
      error           : IgnisignError = null,
      msgNature      ?: IGNISIGN_WEBHOOK_MESSAGE_NATURE,
      action         ?: IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST,
      topic          ?: IGNISIGN_WEBHOOK_TOPICS  
    ): Promise<boolean> => {
    
      return true;
    }

    await ignisignSdkInstance.registerWebhookCallback(exampleWebhookCallback, IGNISIGN_WEBHOOK_TOPICS.APP,               IGNISIGN_WEBHOOK_ACTION_ALL);
    await ignisignSdkInstance.registerWebhookCallback(exampleWebhookCallback, IGNISIGN_WEBHOOK_TOPICS.SIGNATURE,         IGNISIGN_WEBHOOK_ACTION_SIGNATURE.CREATED);
    await ignisignSdkInstance.registerWebhookCallback(exampleWebhookCallback, IGNISIGN_WEBHOOK_TOPICS.SIGNER,            IGNISIGN_WEBHOOK_ACTION_SIGNER.CREATED);
    await ignisignSdkInstance.registerWebhookCallback(exampleWebhookCallback, IGNISIGN_WEBHOOK_TOPICS.DOCUMENT_REQUEST,  IGNISIGN_WEBHOOK_ACTION_DOCUMENT.PROVIDED);

    await ignisignSdkInstance.registerWebhookCallback_SignatureRequest(
      SignatureRequestService.handleSignatureRequestWebhookSigners,  
      IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST.LAUNCHED
    );

    await checkWebhookEndpoint();
      
  } catch (e){
    console.error("Error while initializing Ignisign Nameger Service", e)
  }
}


async function checkWebhookEndpoint() {
  const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();
  if(webhookEndpoints.length === 0)
    console.warn("WARN: No webhook endpoints found, please create one in the Ignisign Console - In dev mode, you can use ngrok to expose your localhost to the internet")
}

async function createNewSigner(signatureProfileId, inputs: { [key in IGNISIGN_SIGNER_CREATION_INPUT_REF] ?: string } = {}, externalId: string = null): Promise<IgnisignSigner_CreationResponseDto> {  

  const dto : IgnisignSigner_CreationRequestDto = {
    signatureProfileId,
    ...inputs,
    ...(externalId && {externalId})
  }

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

async function uploadHashDocument(signatureRequestId, fileHash, label): Promise<string> {

  const dto : IgnisignDocument_InitializationDto = {
    signatureRequestId,
    label,
  }

  const { documentId } = await ignisignSdkInstance.initializeDocument(dto)
  await ignisignSdkInstance.provideDocumentContent_PrivateContent(documentId, fileHash)
  return documentId 
}

async function uploadDocument(signatureRequestId, uploadDto : IgnisignSdkFileContentUploadDto): Promise<string>{

  const dto : IgnisignDocument_InitializationDto = {
    signatureRequestId,
  }
  const { documentId } = await ignisignSdkInstance.initializeDocument(dto)
  await ignisignSdkInstance.provideDocumentContent_File(documentId, uploadDto)
  return documentId
}

async function getSignatureProfiles(): Promise<IgnisignSignatureProfile[]> {  
  return await ignisignSdkInstance.getSignatureProfiles()
}

async function initSignatureRequest(signatureProfileId: string): Promise<string>{
  const {signatureRequestId} = await ignisignSdkInstance.initSignatureRequest({ signatureProfileId })
  return signatureRequestId
}

async function updateSignatureRequest(signatureRequestId : string, dto: IgnisignSignatureRequest_UpdateDto): Promise<IgnisignSignatureRequest_Context> {
  try {
    const data = await ignisignSdkInstance.updateSignatureRequest(signatureRequestId, dto);
    return data
  } catch (error) {
    throw error;
  }
}

async function publishSignatureRequest(signatureRequestId : string) : Promise<IgnisignSignatureRequest_IdContainer>{
  try {
    const data = await ignisignSdkInstance.publishSignatureRequest(signatureRequestId);
    return data
  } catch (error) {
    throw error;
    
  }
}

async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  return await ignisignSdkInstance.consumeWebhook(actionDto);
}

async function getSignatureProfileSignerInputsConstraints(signatureProfileId: string): Promise<IGNISIGN_SIGNER_CREATION_INPUT_REF[]> {
  const result = await ignisignSdkInstance.getSignatureProfileSignerInputsConstraints(signatureProfileId);
  console.log(result)
  return result.inputsNeeded;
}

  async function getSignatureRequestContext(signatureRequestId: string): Promise<IgnisignSignatureRequest_Context> {
    return await ignisignSdkInstance.getSignatureRequestContext(signatureRequestId);
  }