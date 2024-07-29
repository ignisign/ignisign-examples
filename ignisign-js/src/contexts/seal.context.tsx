
import { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../services/api.service";

export interface ISealContext {
  isEnabled: boolean;
  checkSetup: () => Promise<void>;
  seals: any[];
}

export const SealContextProvider = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [seals, setSeals] = useState([]);

  const checkSetup = async () => {
    const isEnabled = await ApiService.checkSealSetup();
    setIsEnabled(!!isEnabled);
  }

  useEffect(() => {
    checkSetup();
  }, []);

  const context = {
    checkSetup,
    isEnabled,
    seals,
  };

  return (
    <SealContext.Provider value={context}>
      {children}
    </SealContext.Provider>
  )
}

export const useSeal = () => useContext(SealContext);
export const SealContext = createContext<ISealContext>({} as ISealContext);
