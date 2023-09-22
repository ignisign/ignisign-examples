import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_SIGNER_CREATION_INPUT_REF } from "@ignisign/public"

export type AppContextType = {
  requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[], 
  signatureProfile: IgnisignSignatureProfile,
  webhooks: IgnisignWebhook[]
}