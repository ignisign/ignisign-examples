
import { createContext, useContext, useEffect, useState } from "react";
import { Contract } from "../models/contract.front-model";
import { ApiService } from "../services/api.service";

export interface IContractContext {
  contracts     : Contract[]
  isLoading     : boolean
  getContracts  : (userId: string) => Promise<void>
  reset         : () => void
}

export const ContractContextProvider = ({ children }) => {
  const [contracts, setContracts] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getContracts = async (userId) => {
    setIsLoading(true)
    try {
      const contracts = await ApiService.getContracts(userId)
      setContracts(contracts)
    } catch (error) {
      console.log(error)  
    } finally {
      setIsLoading(false)
    }
  }
  
  const reset = () => {
    setContracts(null)
  }

  const context = {
    contracts,
    isLoading,
    getContracts,
    reset,
  };

  return (
    <ContractContext.Provider value={context}>
      {children}
    </ContractContext.Provider>
  )
}

export const useContract = () => useContext(ContractContext);
export const ContractContext = createContext<IContractContext>({} as IContractContext);
