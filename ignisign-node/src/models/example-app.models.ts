import { IGNISIGN_APPLICATION_ENV, IGNISIGN_APPLICATION_TYPE } from "@ignisign/public"

export type Example_IgniSign_AppContext = {
  ignisignAppId : string,
  ignisignAppEnv : IGNISIGN_APPLICATION_ENV,
  appType? : IGNISIGN_APPLICATION_TYPE
}