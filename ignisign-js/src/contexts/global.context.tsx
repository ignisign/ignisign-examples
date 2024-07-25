
import { IgnisignSignatureProfile, IgnisignWebhook, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_INTEGRATION_MODE, IGNISIGN_SIGNER_CREATION_INPUT_REF } from "@ignisign/public";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";
import { MY_USER_TYPES } from "../models/user.front.model";
import { AppContextType } from "../models/global.front-model";
// import { RequiredInputs } from "../models/global.front-model";

export interface IGlobalContext {
  appContext: AppContextType
  isFilesPrivates: boolean
  isLoading: boolean
  disabled: boolean
}

export const GlobalContextProvider = ({ children }) => {
  const [isLoading,         setIsLoading]         = useState<boolean>(false)

  const [isFilesPrivates,   setIsFilesPrivates]   = useState<boolean>(null)
  const [appContext,       setAppContext]        = useState<AppContextType>(null)
  const [disabled,         setDisabled]          = useState<boolean>(true)

  const getAppContext = async () => {
    setIsLoading(true)
    try {
      const appContext = await ApiService.getAppContext()
      setAppContext(appContext)
      setDisabled(
        !(appContext?.CUSTOMER?.signerProfile && appContext?.CUSTOMER?.signerProfile)
      )
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
