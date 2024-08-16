
import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_INTEGRATION_MODE, IGNISIGN_SIGNER_CREATION_INPUT_REF, IGNISIGN_APPLICATION_TYPE } from "@ignisign/public";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiService } from "../services/api.service";
import { MY_USER_TYPES } from "../models/user.front.model";
import { Example_AC_BareSignature, Example_AC_LogCapsule, Example_AC_Seal, Example_AC_Signature, ExampleFront_Full_AppContextType } from "../models/global.front-model";
// import { RequiredInputs } from "../models/global.front-model";

export interface IGlobalContext {
  appContext: ExampleFront_Full_AppContextType
  isFilesPrivates: boolean
  isLoading: boolean
  disabled: boolean
  isAppSeal: boolean
  isAppSignature: boolean
  isAppBareSignature: boolean
  isAppLogCapsule: boolean
}

export const GlobalContextProvider = ({ children }) => {
  const [isLoading,         setIsLoading]         = useState<boolean>(false)

  const [isFilesPrivates,   setIsFilesPrivates]   = useState<boolean>(null)
  const [appContext,       setAppContext]        = useState<ExampleFront_Full_AppContextType>(null)
  const [disabled,         setDisabled]          = useState<boolean>(true)

  const isAppSeal           = useMemo(() => appContext?.appContext?.appType === IGNISIGN_APPLICATION_TYPE.SEAL, [appContext])
  const isAppSignature      = useMemo(() => appContext?.appContext?.appType === IGNISIGN_APPLICATION_TYPE.SIGNATURE, [appContext])
  const isAppBareSignature  = useMemo(() => appContext?.appContext?.appType === IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE, [appContext])
  const isAppLogCapsule     = useMemo(() => appContext?.appContext?.appType === IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE, [appContext])

  const getAppContext = async () => {
    setIsLoading(true)
    try {
      const appContext = await ApiService.getAppContext()
      setAppContext(appContext)

      
      switch (appContext?.appContext?.appType) {
        case IGNISIGN_APPLICATION_TYPE.SIGNATURE:
          const appContextSign = appContext as Example_AC_Signature;
          
          setDisabled(!(appContextSign?.CUSTOMER?.signerProfile && appContextSign?.CUSTOMER?.signerProfile))
          break;
        case IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE:
          const appContextBareSign = appContext as Example_AC_BareSignature;
          setDisabled(!appContextBareSign?.signerProfileInfos)
          break;
        case IGNISIGN_APPLICATION_TYPE.SEAL:
          const appContextSeal = appContext as Example_AC_Seal;
          setDisabled(!appContextSeal?.signerProfileInfos)
          break;
        case IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE:
          const appContextLogCapsule = appContext as Example_AC_LogCapsule;
          setDisabled(!appContextLogCapsule)
          break;

      }
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
    appContext,
    isFilesPrivates,
    isLoading,
    disabled,
    isAppSeal,
    isAppSignature,
    isAppBareSignature,
    isAppLogCapsule
  };

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <GlobalContext.Provider value={context}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = () => useContext(GlobalContext);
export const GlobalContext = createContext<IGlobalContext>({} as IGlobalContext);
