import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_SIGNER_CREATION_INPUT_REF, IgnisignSignerProfile } from "@ignisign/public"
import { MY_USER_TYPES } from "./user.front.model"

export type AppContextType = {
  [MY_USER_TYPES.CUSTOMER]: {
    requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[]
    signerProfile: IgnisignSignerProfile
  }
  [MY_USER_TYPES.EMPLOYEE]: {
    requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[]
    signerProfile: IgnisignSignerProfile
  }
  webhooks          : IgnisignWebhook[]
}