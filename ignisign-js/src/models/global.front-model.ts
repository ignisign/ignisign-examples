import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_SIGNER_CREATION_INPUT_REF, IgnisignSignerProfile, IGNISIGN_APPLICATION_ENV, IGNISIGN_APPLICATION_TYPE } from "@ignisign/public"
import { MY_USER_TYPES } from "./user.front.model"


export type Example_IgniSign_AppContext = {
  ignisignAppId : string,
  ignisignAppEnv : IGNISIGN_APPLICATION_ENV,
  appType? : IGNISIGN_APPLICATION_TYPE
}

export type Example_SignerInfo = {
  requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[],
  signerProfile: IgnisignSignerProfile
}

export type Example_AC_Signature = {
  [MY_USER_TYPES.CUSTOMER]: Example_SignerInfo;
  [MY_USER_TYPES.EMPLOYEE]: Example_SignerInfo;
  webhooks   : IgnisignWebhook[]
  appContext : Example_IgniSign_AppContext
}

export type Example_AC_BareSignature = {
  signerProfileInfos : Example_IgniSign_AppContext
  appContext : Example_IgniSign_AppContext
}

export type Example_AC_Seal = {
  signerProfileInfos : Example_SignerInfo
  webhooks   : IgnisignWebhook[]
  appContext : Example_IgniSign_AppContext
}

export type Example_AC_LogCapsule = {
  appContext : Example_IgniSign_AppContext
}

export type ExampleFront_Full_AppContextType = Example_AC_Signature | Example_AC_BareSignature | Example_AC_Seal | Example_AC_LogCapsule