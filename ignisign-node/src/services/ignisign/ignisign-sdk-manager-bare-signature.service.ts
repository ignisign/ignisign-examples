import { Ignisign_BareSignature_ProofAccessToken, IGNISIGN_APPLICATION_ENV, Ignisign_BareSignature_GetAuthrozationUrlRequest, Ignisign_BareSignature_GetAuthrozationUrlResponse, IgnisignSignerProfile, IGNISIGN_SIGNER_CREATION_INPUT_REF, IgnisignApplication_BareSignatureEnvSettings, Ignisign_BareSignature_Proof } from "@ignisign/public";
import { IgnisignSdk, Ignisign_BareSignature_SdkProofAccessTokenRequest } from "@ignisign/sdk";

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

async function init(appId: string, appEnv: IGNISIGN_APPLICATION_ENV, appSecret: string) {
  _logIfDebug("IgnisignSdkManagerSignatureService: init")
  
  if(!appId || !appEnv || !appSecret)
    throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_SECRET are mandatory to init IgnisignSdkManagerSignatureService`);
    
  try {
    if(isIgnisignSdkInstanceInitialized)
      return;

    isIgnisignSdkInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkInstance = new IgnisignSdk({
      appId,
      appEnv,
      appSecret,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
  
  } catch (e){
    isIgnisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

async function getAuthorizationUrl( dto: Ignisign_BareSignature_GetAuthrozationUrlRequest ) : Promise<Ignisign_BareSignature_GetAuthrozationUrlResponse> {
  try {
    return await ignisignSdkInstance.getBareSignatureAuthorizationUrl(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getBareSignatureProofToken(dto: Ignisign_BareSignature_SdkProofAccessTokenRequest) : Promise<Ignisign_BareSignature_ProofAccessToken> {
  try {
    return await ignisignSdkInstance.getBareSignatureProofToken(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getBareSignatureProofs(headerToken : string) : Promise<Ignisign_BareSignature_Proof> {
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


