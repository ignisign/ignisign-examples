import { IgnisignBareSignature_ProofAccessToken, IGNISIGN_APPLICATION_ENV, IgnisignBareSignature_GetAuthrozationUrlRequest, IgnisignBareSignature_GetAuthrozationUrlResponse, IgnisignSignerProfile, IGNISIGN_SIGNER_CREATION_INPUT_REF, IgnisignApplication_BareSignatureEnvSettings, IgnisignBareSignature_Proof } from "@ignisign/public";
import { IgnisignSdk, IgnisignBareSignature_SdkProofAccessTokenRequest } from "@ignisign/sdk";

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}

let ignisignSdkInstance: IgnisignSdk = null;
let isIgnisignSdkInstanceInitialized = false;

export const IgnisignSdkManagerBareSignatureService = {
  init,
  getAuthorizationUrl,
  getBareSignatureProofToken,
  getBareSignatureProofs,
  getSignerProfiles,
  getBareSignatureConfiguration,
}

/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

async function init(apiKey: string) {
  _logIfDebug("IgnisignSdkManagerSignatureService: init")
  
  if(!apiKey)
    throw new Error(`IGNISIGN_API_KEY is mandatory to init IgnisignSdkManagerBareSignatureService`);
    
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
  
  } catch (e){
    isIgnisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

async function getAuthorizationUrl( dto: IgnisignBareSignature_GetAuthrozationUrlRequest ) : Promise<IgnisignBareSignature_GetAuthrozationUrlResponse> {
  try {
    return await ignisignSdkInstance.getBareSignatureAuthorizationUrl(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getBareSignatureProofToken(dto: IgnisignBareSignature_SdkProofAccessTokenRequest) : Promise<IgnisignBareSignature_ProofAccessToken> {
  try {
    return await ignisignSdkInstance.getBareSignatureProofToken(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getBareSignatureProofs(headerToken : string) : Promise<IgnisignBareSignature_Proof> {
  try {
    return await ignisignSdkInstance.getBareSignatureProofs(headerToken);
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

  async function getBareSignatureConfiguration() : Promise<IgnisignApplication_BareSignatureEnvSettings>{
    try {
      return await ignisignSdkInstance.getBareSignatureConfiguration();
    } catch (error) {
      console.error(error.toString());
      throw error
    }
  }



