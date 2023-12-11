
import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_INTEGRATION_MODE, IGNISIGN_SIGNER_CREATION_INPUT_REF } from "@ignisign/public";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";

export interface IGlobalContext {
  requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[]
  signatureProfile: IgnisignSignatureProfile
  webhooks: IgnisignWebhook[]
  isEmbedded: boolean
  isFilesPrivates: boolean
  isLoading: boolean
}

export const GlobalContextProvider = ({ children }) => {
  const [isLoading,         setIsLoading]         = useState<boolean>(false)
  const [requiredInputs,    setRequiredInputs]    = useState<IGNISIGN_SIGNER_CREATION_INPUT_REF[]>([])
  const [isEmbedded,        setIsEmbedded]        = useState<boolean>(null)
  const [signatureProfile,  setSignatureProfile]  = useState<IgnisignSignatureProfile>(null)
  const [isFilesPrivates,   setIsFilesPrivates]   = useState<boolean>(null)
  const [webhooks,          setWebhooks]          = useState<IgnisignWebhook[]>(null)

  const getAppContext = async () => {
    setIsLoading(true)
    try {
      const appContext = await ApiService.getAppContext()
      
      setRequiredInputs(appContext.requiredInputs)
      setSignatureProfile(appContext.signatureProfile)
      setIsEmbedded(appContext.signatureProfile.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED)
      setIsFilesPrivates(appContext.signatureProfile.documentTypes.includes(IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE))
      setWebhooks(appContext.webhooks)
    } catch (error) {
      console.log(error)  
    }
    finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getAppContext()
  }, [])
  

  const context = {
    requiredInputs,
    isEmbedded,
    signatureProfile,
    isFilesPrivates,
    webhooks,
    isLoading,
  };

  return (
    <GlobalContext.Provider value={context}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = () => useContext(GlobalContext);
export const GlobalContext = createContext<IGlobalContext>({} as IGlobalContext);
