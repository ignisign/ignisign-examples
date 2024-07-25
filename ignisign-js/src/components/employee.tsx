import { Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components-ui/button";
import Card from "../components-ui/card";
import { Input } from "../components-ui/input";
import Select from "../components-ui/select";
import { useEmployee } from "../contexts/employee.context";
import { useGlobal } from "../contexts/global.context";
import { INPUTS } from "../utils/inputs.utils";
import { MY_USER_TYPES } from "../models/user.front.model";

const NewEmployeeDialog = ({isOpen, onClose}) => {
  const form                    = useForm();
  const {addEmployee, isLoading}  = useEmployee()
  const {appContext}        = useGlobal()
  const inputs                  = INPUTS.filter(e => appContext[MY_USER_TYPES.EMPLOYEE].requiredInputs.includes(e.name))
  

  useEffect(() => {
    inputs.forEach((e : any) => {
      form.setValue(e.name, e.faker());
    })
  }, [isOpen])

  const add = () => {
    const hasAll = inputs.every(e => form.getValues()[e.name])
    if(!hasAll){
      form.trigger()
      return
    }
    addEmployee(form.getValues())
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <form onSubmit={form.handleSubmit(add)}>
        <DialogTitle>Create a new Employee</DialogTitle>
        <DialogContent>
          <div className='flex flex-wrap'>
              {
                inputs.map(e => (
                  <div className='px-2 pb-4' key={e.name}>
                    <Input required label={e.label} form={form} name={e.name} type={e.type} dataset={e?.dataset || []} /> 
                  </div>
                )
              )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type='submit' loading={isLoading}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export const Employees = () => {
  const {employees, isLoading, setSelectedEmployeeId} = useEmployee()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      {
        isDialogOpen && 
        <NewEmployeeDialog isOpen={true} onClose={()=>setIsDialogOpen(false)}/>
      }
      <Card className="flex-1 flex-col">
        <div className='flex items-center gap-3'>
          <div className='font-medium'>Choose an Employee</div>
          <div>
            <Button onClick={()=>setIsDialogOpen(true)}>New Employee</Button>
          </div>
        </div>
        <div className='mt-4 w-full'>
          {
            isLoading ? <>
              <div className='text-center'>Loading Employees...</div>
            </> : <>
              {
                !employees || employees.length === 0 ? <div className='text-center'>No employees found</div>
                : <Select callback={setSelectedEmployeeId} options={employees?.map(e=>({key: e._id, value: e.email}))}/>
              }
            </>
          }
        </div>
      </Card>
    </>
  )
}