
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";
import { IgnisignSignatureRequest_WithDocName } from "@ignisign/public";

export interface ISealContext {
  isEnabled: boolean;
  checkSetup: () => Promise<void>;

  isSealLoading: boolean;
  isSealInit: boolean;
  seals: IgnisignSignatureRequest_WithDocName[];
  getSeals: () => Promise<void>;
}

export const SealContextProvider = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const [isSealLoading, setIsSealLoading] = useState(false);
  const [isSealInit, setIsSealInit]       = useState(false);
  const [seals, setSeals]                 = useState([]);

  const checkSetup = async () => {
    const {isEnabled} = await ApiService.checkSealSetup();
    setIsEnabled(!!isEnabled);
  }

  const getSeals = async () => {
    try {
      setIsSealLoading(true);
      const seals = await ApiService.getSeals();
      setSeals(seals);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSealInit(true);
      setIsSealLoading(false);
    }
  }

  useEffect(() => {
    checkSetup();
    getSeals();
  }, []);

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
