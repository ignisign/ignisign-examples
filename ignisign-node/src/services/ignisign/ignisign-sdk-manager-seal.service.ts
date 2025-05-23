import { IGNISIGN_APPLICATION_ENV, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_SIGNATURE_METHOD_REF, IGNISIGN_SIGNATURE_PROOF_TYPE, IGNISIGN_SIGNATURE_REQUEST_TYPE, IGNISIGN_SIGNER_CREATION_INPUT_REF, IGNISIGN_WEBHOOK_ACTION_SIGNATURE, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST, IGNISIGN_WEBHOOK_MESSAGE_NATURE, IgnisignSealM2M_DocumentContentRequestDto, IgnisignSealM2M_DocumentHashRequestDto, IgnisignSealM2M_DocumentJSONRequestDto, IgnisignSealM2M_DocumentXMLRequestDto, IgnisignSignatureRequest_WithDocName, IgnisignSignerProfile, IgnisignWebhook, IgnisignWebhookDto_Signature, IgnisignWebhookDto_SignatureProof_Success, IgnisignWebhookDto_SignatureRequest, IgnisignWebhook_ActionDto, IgnisignWebhook_CallbackParams } from "@ignisign/public";
import { IgnisignSdk, IgnisignSdkUtilsService } from "@ignisign/sdk";
import { IgnisignSdkManagerCommonsService } from "./ignisign-sdk-manager-commons.service";
import { SealService } from "../example/seal.service";
// import { SealService } from "../example/seal.service";
const crypto = require('crypto');
const fs = require('fs');


let isIgnisignSdkInstanceInitialized : boolean = false;
let ignisignSdkInstance: IgnisignSdk = null;

let m2mId = null;
let m2mPrivateKey = null;

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}


export const IgnisignSdkManagerSealService = {
  init,
  isEnabled,
  checkWebhookEndpoint,
  getWebhookEndpoints,
  consumeWebhook,
  getSignerProfiles,
  getSignerProfile,
  getSignerInputsConstraintsFromSignerProfileId,

  createM2mSignatureRequest,
  createSealSignatureRequest,
  getSeals,
  getNewSignerAuthSecret,
}

async function getNewSignerAuthSecret(ignisignSignerId) {
  const authSecret = await ignisignSdkInstance.regenerateSignerAuthSecret(ignisignSignerId);
  return authSecret.authSecret 
}

/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

function isEnabled(): boolean {
  return isIgnisignSdkInstanceInitialized;
}

async function init(apiKey: string, m2mIdParam : string, m2mPrivateKeyParam: string) {
  _logIfDebug("IgnisignSdkManagerSEALSignatureService: init")
  
  if(!apiKey)
    throw new Error(`IGNISIGN_API_KEY is mandatory to init IgnisignSdkManagerSealService`);
  
  m2mId         = m2mIdParam;
  m2mPrivateKey = m2mPrivateKeyParam
  try {
    if(isIgnisignSdkInstanceInitialized)
      return;

    isIgnisignSdkInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkInstance = new IgnisignSdk({
      apiKey,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
    
    await ignisignSdkInstance.registerWebhookCallback_SignatureRequest(     // Registering the webhookHandler_LaunchSignatureRequest callback function
      webhookHandler_LaunchSignatureRequest, 
      IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST.LAUNCHED
    );

    await ignisignSdkInstance.registerWebhookCallback_SignatureRequest(     // Registering the webhookHandler_LaunchSignatureRequest callback function
      webhookHandler_CompleteSignatureRequest, 
      IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST.COMPLETED
    );

    await ignisignSdkInstance.registerWebhookCallback_Signature(    // Registering the webhookHandler_signatureFinalized callback function
      webhookHandler_signatureFinalized, 
      IGNISIGN_WEBHOOK_ACTION_SIGNATURE.FINALIZED
    );
  
    await ignisignSdkInstance.registerWebhookCallback_SignatureProof(   // Registering the webhookHandler_SignatureProofGenerated callback function
      webhookHandler_SignatureProofGenerated, 
      IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF.GENERATED
    );

    await checkWebhookEndpoint();

  } catch (e){
    isIgnisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

async function createM2mSignatureRequest(
  fileBuffer : Buffer, 
  inputType: string, 
  mimeType : string 
): Promise<{signatureRequestId: string, proofBase64: string, m2mId: string}> {


  enum InputType {
    FILE = 'FILE',
    FILE_PRIVATE = 'FILE_PRIVATE',
    JSON = 'JSON',
    XML = 'XML'
  }

  const documentHash  = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  
  const { signature :documentHashSignedByM2MPrivateKey } = IgnisignSdkUtilsService.sealM2M_doSignPayload(m2mPrivateKey, documentHash)

  let documentType = null;
  let document = null;
  // asPrivateFile = false;

  let dto : any = {
    m2mId,
    documentHashSignedByM2MPrivateKey,
  }

  if(inputType === InputType.FILE_PRIVATE) {
    documentType = IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE;
    const doc: IgnisignSealM2M_DocumentHashRequestDto = {
      documentHash,
      documentType: IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE,
    }

    if(mimeType) {
      doc.mimeType = mimeType;
    }
   
    document = doc;
    
  } else if(inputType === InputType.XML){

      documentType = IGNISIGN_DOCUMENT_TYPE.DATA_XML;

      const xmlContent = fileBuffer.toString('utf-8');

      const doc: IgnisignSealM2M_DocumentXMLRequestDto = {
        documentHash,
        xmlContent,
        documentType,
      }
      document = doc;
    
  } else if(inputType === InputType.FILE){

    if(mimeType === "application/pdf") {
      documentType = IGNISIGN_DOCUMENT_TYPE.PDF;
    } else {
      documentType = IGNISIGN_DOCUMENT_TYPE.FILE;
    }

    const documentBase64 = fileBuffer.toString('base64');

    const doc: IgnisignSealM2M_DocumentContentRequestDto = {
      contentB64: documentBase64,
      mimeType,
      // fileName,
      documentHash,
      documentType,
    }
    document = doc;
    
  
    dto = { ...dto, document }

  } else if(inputType === InputType.JSON) {
      documentType = IGNISIGN_DOCUMENT_TYPE.DATA_JSON;
      try {
        const jsonContent: any = JSON.parse(fileBuffer.toString('utf-8'));

        const doc: IgnisignSealM2M_DocumentJSONRequestDto = {
          documentHash,
          jsonContent,
          documentType,
        }
        document = doc;

      } catch(e) {
        throw new Error(`Error when parsing json file ${e.toString()}`);
      }

  } else {
    documentType = IGNISIGN_DOCUMENT_TYPE.FILE;

    const documentBase64 = fileBuffer.toString('base64');

    const doc: IgnisignSealM2M_DocumentContentRequestDto = {
      contentB64: documentBase64,
      mimeType,
      // fileName,
      documentHash,
      documentType,
    }
    document = doc;
  

  }

  dto = { ...dto, document }
      

    

  console.log("dto createM2mSignatureRequest", dto);

  const signResult = await ignisignSdkInstance.signM2M(dto);

  console.log("signResult", signResult);
  const {signatureRequestId, proofBase64, proofType } = signResult;

  if(signResult.proofType === IGNISIGN_SIGNATURE_PROOF_TYPE.PDF_WITH_SIGNATURES) {
    return {
      signatureRequestId,
      proofBase64,
      m2mId
    }
  } else if(proofType === IGNISIGN_SIGNATURE_PROOF_TYPE.SIGNED_DATA){
    const stringProof = Buffer.from(proofBase64, 'base64').toString('utf-8');

    if(documentType === IGNISIGN_DOCUMENT_TYPE.DATA_JSON){
      console.log("jsonProof", stringProof);
    } else {
      console.log("xmlProof", stringProof);
    }

    return {
      signatureRequestId,
      proofBase64,
      m2mId
    }
  } else {
    throw new Error(`Proof type ${proofType} not supported`);
  }
}

async function getSeals(): Promise<IgnisignSignatureRequest_WithDocName[]> {
  const result = await ignisignSdkInstance.getSignatureRequestsByAppIdAndAppEnv();
  const signatureRequests = result.signatureRequests;
  return signatureRequests;
}

type CreateSealSignatureRequestResponse = {
  signatureRequestId: string;
}

async function createSealSignatureRequest(signerId: string, fileStream, mimeType : string, asPrivateFile: boolean ): Promise<CreateSealSignatureRequestResponse> {  
  const {signatureRequestId} = await ignisignSdkInstance.initSignatureRequest();

  const {documentId} = await ignisignSdkInstance.initializeDocument({signatureRequestId})

  await ignisignSdkInstance.provideDocumentContent_File(documentId, {
    contentType: mimeType,
    fileStream,
    fileName: "test.pdf"
  })
  console.log(4, asPrivateFile);

  // const signerId = "66c6ec75097bac1c1859dd36"; 
  console.log(5);

  await ignisignSdkInstance.updateSignatureRequest(signatureRequestId, {
    // signatureRequestType: IGNISIGN_SIGNATURE_REQUEST_TYPE.SEAL,
    title: "Test Seal Signature Request",
    signerIds: [signerId],
    documentIds: [documentId],
  })
  console.log(6);

  await ignisignSdkInstance.publishSignatureRequest(signatureRequestId);

  return {
    signatureRequestId
  }
}

async function getSignerProfile(signerProfileId: string): Promise<IgnisignSignerProfile> {
  try {
    return await ignisignSdkInstance.getSignerProfile(signerProfileId);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getSignerProfiles(): Promise<IgnisignSignerProfile[]> {
  try {
    return await ignisignSdkInstance.getSignerProfiles();
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getSignerInputsConstraintsFromSignerProfileId(signatureProfileId: string): Promise<IGNISIGN_SIGNER_CREATION_INPUT_REF[]> {
  
  const result = await ignisignSdkInstance.getSignerInputsConstraintsFromSignerProfileId(signatureProfileId);
  return result.inputsNeeded;
}



/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** WEBHOOKS *********************************************************************************/
/******************************************************************************************** ******************************************************************************************/


// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint() : Promise<void>{
  return IgnisignSdkManagerCommonsService.checkWebhookEndpoint(ignisignSdkInstance);
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints() : Promise<IgnisignWebhook[]>{
  return IgnisignSdkManagerCommonsService.getWebhookEndpoints(ignisignSdkInstance);
    
}

// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  return IgnisignSdkManagerCommonsService.consumeWebhook(ignisignSdkInstance, actionDto);
}

// The callback function is called when a webhook is received when a signature proof has been generated
async function webhookHandler_SignatureProofGenerated (params: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureProof_Success>): Promise<void>{
  const { content, error, msgNature, action, topic } = params;

  if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
    console.error("webhookHandler_SignatureProofGenerated ERROR : ", error);
    return;
  }
  const { signatureRequestExternalId, signatureProofUrl } = content as IgnisignWebhookDto_SignatureProof_Success;

  _logIfDebug("webhookHandler_SignatureProofGenerated", {signatureRequestExternalId, signatureProofUrl})

  // TODO
}

async function webhookHandler_CompleteSignatureRequest (params: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureRequest>): Promise<void> {
  const { content, error, msgNature, action, topic } = params;

  if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
    console.error("webhookHandler_LaunchSignatureRequest ERROR : ", error);
    return;
  }

  const { signatureRequestExternalId, signatureRequestId } = content as IgnisignWebhookDto_SignatureRequest;
  await SealService.sealIsComplete(signatureRequestId);
}

// The callback function is called when a webhook is received about the lauch of a signature request
async function webhookHandler_LaunchSignatureRequest (params: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureRequest>): Promise<void> {
  const { content, error, msgNature, action, topic } = params;

  if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
    console.error("webhookHandler_LaunchSignatureRequest ERROR : ", error);
    return;
  }

  const { signatureRequestExternalId, signatureRequestId, signers: {signersBySide, signersEmbedded} } = content as IgnisignWebhookDto_SignatureRequest;
  const signers = [...signersBySide, ...signersEmbedded] as any
  console.log({
    signatureRequestId,
    signers
  });
  
  await SealService.addTokenToSigner(signatureRequestId, signers[0].signerId, signers[0].token);
  // _logIfDebug("webhookHandler_LaunchSignatureRequest", {signatureRequestExternalId, signatureRequestId})

  // await SealService.addTokenToSigner(signatureRequestId, signers[0].signerId, signers[0].signatureToken);
}

// The callback function is called when a webhook is received when a signature has been finalized
async function webhookHandler_signatureFinalized (params: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_Signature>): Promise<void> {
  const { content, error, msgNature, action, topic } = params;
  
  if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
    console.error("webhookHandler_signatureFinalized ERROR : ", error);
    return;
  }
  const {signatureRequestExternalId, signatureRequestId, signerExternalId} = content as IgnisignWebhookDto_Signature;

  _logIfDebug("webhookHandler_signatureFinalized", {signatureRequestExternalId, signatureRequestId, signerExternalId})

  // TODO
}