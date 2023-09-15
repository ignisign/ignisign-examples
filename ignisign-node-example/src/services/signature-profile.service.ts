import { IGNISIGN_INTEGRATION_MODE, IgnisignSignatureProfile } from "@ignisign/public";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";

const getSignatureProfiles = async () : Promise<IgnisignSignatureProfile[]> => {
  const signatureProfiles = await IgnisignSdkManagerService.getSignatureProfiles()
  
  if(signatureProfiles?.length === 0){
    console.warn("WARN: No signature profiles found")
    return [];
  }
    
  const embeddedSignatureProfile = signatureProfiles?.filter(e=>e.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED)

  if(embeddedSignatureProfile?.length === 0)
    console.warn("WARN: No Signature Profiles Found with integrationMode = EMBEDDED, please create one in the Ignisign Console")
  
  return embeddedSignatureProfile;
}

export const SignatureProfileService = {
  getSignatureProfiles
}