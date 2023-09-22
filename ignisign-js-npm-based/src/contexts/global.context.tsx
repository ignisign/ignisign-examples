
import { IgnisignSignatureProfile, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_INTEGRATION_MODE } from "@ignisign/public";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";

export interface IGlobalContext {
  requiredInputs
  isEmbedded
  signatureProfile
  isFilesPrivates
  webhooks
  isLoading
}

export const GlobalContextProvider = ({ children }) => {
  const [isLoading,         setIsLoading]        = useState<boolean>(false)
  const [requiredInputs,    setRequiredInputs]   = useState<any>([])
  const [isEmbedded,        setIsEmbedded]       = useState(null)
  const [signatureProfile,  setSignatureProfile] = useState<IgnisignSignatureProfile>(null)
  const [isFilesPrivates,   setIsFilesPrivates]  = useState(null)
  const [webhooks,          setWebhooks]         = useState(null)

  const getAppContext = async () => {
    setIsLoading(true)
    try {
      const appContext = await ApiService.getAppContext()
      
      setRequiredInputs(appContext.requiredInputs)
      setSignatureProfile(appContext.signatureProfile)
      setIsEmbedded(appContext.signatureProfile.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED)
      setIsFilesPrivates(appContext.signatureProfile.documentTypes.includes(IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE))
      setWebhooks(appContext.webhooks)
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
