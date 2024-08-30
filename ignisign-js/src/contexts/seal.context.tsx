
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";
import { IGNISIGN_APPLICATION_ENV, IgnisignSignatureRequest_WithDocName } from "@ignisign/public";
import { useGlobal } from "./global.context";

export type Seal = {
  _id                     ?: string;
  signatureRequestId      ?: string;
  type                   ?: 'M2M' | 'MANUAL';
  status                 ?: 'INIT' | 'DONE' | 'CREATED';
  title                  ?: string;
  ignisignSignerId        ?: string;
  ignisignSignatureToken  ?: string;
  ignisignAppId           ?: string;
  ignisignAppEnv          ?: IGNISIGN_APPLICATION_ENV;
}

export interface ISealContext {
  isEnabled: boolean;
  checkSetup: () => Promise<void>;

  isSealLoading: boolean;
  isSealInit: boolean;
  seals: Seal[];
  getSeals: () => Promise<void>;
}

export const SealContextProvider = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const [isSealLoading, setIsSealLoading] = useState(false);
  const [isSealInit, setIsSealInit]       = useState(false);
  const [seals, setSeals]                 = useState([]);
  const { isAppSeal, appContext}          = useGlobal();

  const checkSetup = async () => {
    const {isEnabled} = await ApiService.checkSealSetup();
    setIsEnabled(!!isEnabled);
  }

  const getSeals = async () => {
    try {
      setIsSealLoading(true);
      const seals = await ApiService.getSeals();
      setSeals(seals.sort(() => -1));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSealInit(true);
      setIsSealLoading(false);
    }
  }

  useEffect(() => {
    if(!appContext || !isAppSeal) 
      return;
    checkSetup();
    getSeals();
  }, [isAppSeal, appContext ]);

  const context = {
    checkSetup,
    isEnabled,
    seals,
    isSealLoading,
    isSealInit,
    getSeals,
  };

  return (
    <SealContext.Provider value={context}>
      {children}
    </SealContext.Provider>
  )
}

export const useSeal = () => useContext(SealContext);
export const SealContext = createContext<ISealContext>({} as ISealContext);
