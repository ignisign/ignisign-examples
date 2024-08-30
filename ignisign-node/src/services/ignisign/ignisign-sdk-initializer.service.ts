import { IGNISIGN_APPLICATION_ENV, IGNISIGN_APPLICATION_TYPE, IgnisignApplication_Context } from "@ignisign/public"
import { IgnisignSdkUtilsService } from "@ignisign/sdk"
import { IgnisignSdkManagerSignatureService } from "./ignisign-sdk-manager-signature.service"
import { IgnisignSdkManagerBareSignatureService } from "./ignisign-sdk-manager-bare-signature.service"
import { IgnisignSdkManagerSealService } from "./ignisign-sdk-manager-seal.service"
import { IgnisignSdkManagerLogCapsuleService } from "./ignisign-sdk-manager-logs-capsule.service"
import { Example_IgniSign_AppContext } from "../../models/example-app.models"

const IGNISIGN_APP_ID     : string = process.env.IGNISIGN_APP_ID
const IGNISIGN_APP_ENV    : IGNISIGN_APPLICATION_ENV = IGNISIGN_APPLICATION_ENV[process.env.IGNISIGN_APP_ENV]
const IGNISIGN_APP_TYPE   : IGNISIGN_APPLICATION_TYPE = IGNISIGN_APPLICATION_TYPE[process.env.IGNISIGN_APP_TYPE]
const IGNISIGN_APP_SECRET = process.env.IGNISIGN_APP_SECRET

const DEBUG_LOG_ACTIVATED = false;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }


export const IgnisignInitializerService = {
  getAppContext,
  initSdks,
  getSDkManagerSignatureService
}

async function getAppContext( withAppType: boolean = false) : Promise<Example_IgniSign_AppContext>{
 return {
    ignisignAppId : IGNISIGN_APP_ID,
    ignisignAppEnv : IGNISIGN_APP_ENV,
    appType : withAppType ? IGNISIGN_APP_TYPE : undefined
  }
}

async function getSDkManagerSignatureService() : Promise<any> {
  const appContext = await getAppContext(true)

  return appContext.appType === IGNISIGN_APPLICATION_TYPE.SIGNATURE       ? IgnisignSdkManagerSignatureService 
      : (appContext.appType === IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE) ? IgnisignSdkManagerBareSignatureService 
      : (appContext.appType === IGNISIGN_APPLICATION_TYPE.SEAL)           ? IgnisignSdkManagerSealService 
      : (appContext.appType === IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE)    ? IgnisignSdkManagerLogCapsuleService
      : null
}

async function initSdks(){
  try {
    const appContext = await getAppContext(true)

    _logIfDebug("appContext", appContext)
  
    if(!appContext.ignisignAppId || !appContext.ignisignAppEnv || !appContext.appType)
      throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_TYPE are mandatory to init Ignisign SDKs`);
    
    switch (appContext.appType){
  
      case IGNISIGN_APPLICATION_TYPE.SIGNATURE:
        await IgnisignSdkManagerSignatureService.init(appContext.ignisignAppId, appContext.ignisignAppEnv, IGNISIGN_APP_SECRET)
        break;
  
      case IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE:
        await IgnisignSdkManagerBareSignatureService.init(appContext.ignisignAppId, appContext.ignisignAppEnv, IGNISIGN_APP_SECRET)
        break;
  
      case IGNISIGN_APPLICATION_TYPE.SEAL:
  
        if(!process.env.IGNISIGN_M2M_ID || !process.env.IGNISIGN_M2M_PRIVATE_KEY)
          throw new Error(`IGNISIGN_M2M_ID and IGNISIGN_M2M_PRIVATE_KEY are mandatory to init IgnisignSdkManagerSealManager`);
  
        const privateKey = IgnisignSdkUtilsService.parsePrivateKeyFromEnv(process.env.IGNISIGN_M2M_PRIVATE_KEY)
        await IgnisignSdkManagerSealService.init(appContext.ignisignAppId, appContext.ignisignAppEnv, IGNISIGN_APP_SECRET, process.env.IGNISIGN_M2M_ID, privateKey)
        break;
  
      case IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE:
        await IgnisignSdkManagerLogCapsuleService.init(appContext.ignisignAppId, appContext.ignisignAppEnv, IGNISIGN_APP_SECRET)
        break;
      
  
      default:
        throw new Error(`appType ${appContext.appType} not supported`);
        break;
    }

  } catch(e) {

    console.error(e)
    process.exit(1)
  }
 
}

