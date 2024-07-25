
import { createContext, useContext, useEffect, useState } from "react";
import { MyUser } from "../models/user.front.model";
import { ApiService } from "../services/api.service";
import { useGlobal } from "./global.context";

export interface IEmployeeContext {
  employees             : MyUser[]
  addEmployee           : (data) => Promise<void>
  isLoading           : boolean
  setSelectedEmployeeId : (id: string) => void
  selectedEmployeeId    : string
}

export const EmployeeContextProvider = ({ children }) => {

  const [employees,           setEmployees]           = useState<MyUser[]>(null)
  const [isLoading,         setIsLoading]         = useState<boolean>(false)
  const [selectedEmployeeId,  setSelectedEmployeeId]  = useState<string>(null)

  const addEmployee = async (data) => {
    setIsLoading(true)
    
    const employee = await ApiService.addEmployee(data)
    if(!selectedEmployeeId){
      setSelectedEmployeeId(employee._id)
    }

    setEmployees([...employees, employee])
    setIsLoading(false)
  }

  const getEmployees = async () => {
    setIsLoading(true)
    try {
      const employees = await ApiService.getEmployees()
      if(employees && employees.length > 0){
        setSelectedEmployeeId(employees[0]._id)
      }
      
      setEmployees(employees)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getEmployees()
  }, [])

  const context = {
    employees,
    addEmployee,
    isLoading,
    setSelectedEmployeeId,
    selectedEmployeeId,
  };

  return (
    <EmployeeContext.Provider value={context}>
      {children}
    </EmployeeContext.Provider>
  )
}

export const useEmployee     = () => useContext(EmployeeContext);
export const EmployeeContext = createContext<IEmployeeContext>({} as IEmployeeContext);
