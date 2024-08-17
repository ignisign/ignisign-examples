import { IGNISIGN_APPLICATION_ENV, IgnisignLogCapsule_ResponseDto } from "@ignisign/public";
import { IgnisignSdk } from "@ignisign/sdk";

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}

let ignisignSdkInstance: IgnisignSdk = null;
let isIgnisignSdkInstanceInitialized = false;

export const IgnisignSdkManagerLogCapsuleService = {
  init,
  logCapsuleCreate,
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

async function logCapsuleCreate( hashSha256_b64 : string ) : Promise<IgnisignLogCapsule_ResponseDto> {

  try {
    return await ignisignSdkInstance.logCapsuleCreate(hashSha256_b64);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}