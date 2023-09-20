
import { createContext, useContext, useEffect, useState } from "react";
import { MyUser } from "../models/user.front.model";

import { ApiService } from "../services/api.service";
import { useGlobal } from "./global.context";

export interface ICustomerContext {
  customers: MyUser[],
  addCustomer: (data) => Promise<void>,
  isLoading: boolean
  setSelectedCustomerId: (id: string) => void,
  selectedCustomerId: string,
  // reset
}

export const CustomerContextProvider = ({ children }) => {

  const [ customers, setCustomers ] = useState<MyUser[]>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const addCustomer = async (data): Promise<void> => {
    setIsLoading(true)
    const customer = await ApiService.addCustomer(data)
    if(!selectedCustomerId){
      setSelectedCustomerId(customer._id)
    }
    setCustomers([...customers, customer])
    setIsLoading(false)
  }

  const getCustomers = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const customers = await ApiService.getCustomers()
      if(customers && customers.length > 0){
        setSelectedCustomerId(customers[0]._id)
      }
      
      setCustomers(customers)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getCustomers()
  }, [])


  const context = {
    customers,
    addCustomer,
    isLoading,
    setSelectedCustomerId,
    selectedCustomerId,
  };

  return (
    <CustomerContext.Provider value={context}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => useContext(CustomerContext);
export const CustomerContext = createContext<ICustomerContext>({} as ICustomerContext);
