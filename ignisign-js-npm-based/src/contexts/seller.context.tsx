
import { createContext, useContext, useEffect, useState } from "react";
import { MyUser } from "../models/user.front.model";
import { ApiService } from "../services/api.service";
import { useGlobal } from "./global.context";

export interface ISellerContext {
  sellers             : MyUser[]
  addSeller           : (data) => Promise<void>
  isLoading           : boolean
  setSelectedSellerId : (id: string) => void
  selectedSellerId    : string
}

export const SellerContextProvider = ({ children }) => {

  const [sellers,           setSellers]           = useState<MyUser[]>(null)
  const [isLoading,         setIsLoading]         = useState<boolean>(false)
  const [selectedSellerId,  setSelectedSellerId]  = useState<string>(null)

  const addSeller = async (data) => {
    setIsLoading(true)
    
    const seller = await ApiService.addSeller(data)
    if(!selectedSellerId){
      setSelectedSellerId(seller._id)
    }

    setSellers([...sellers, seller])
    setIsLoading(false)
  }

  const getSellers = async () => {
    setIsLoading(true)
    try {
      const sellers = await ApiService.getSellers()
      if(sellers && sellers.length > 0){
        setSelectedSellerId(sellers[0]._id)
      }
      
      setSellers(sellers)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getSellers()
  }, [])

  const context = {
    sellers,
    addSeller,
    isLoading,
    setSelectedSellerId,
    selectedSellerId,
  };

  return (
    <SellerContext.Provider value={context}>
      {children}
    </SellerContext.Provider>
  )
}

export const useSeller = () => useContext(SellerContext);
export const SellerContext = createContext<ISellerContext>({} as ISellerContext);
