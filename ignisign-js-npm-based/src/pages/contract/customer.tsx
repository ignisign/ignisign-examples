import { Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/button";
import Card from "../../components/card";
import { Input } from "../../components/input";
import Select from "../../components/select";
import { useCustomer } from "../../contexts/customer.context";
import { useGlobal } from "../../contexts/global.context";
import { INPUTS } from "../../utils/inputs";

const NewCustomerDialog = ({isOpen, onClose}) => {
  const {addCustomer, isLoading} = useCustomer()
  const {requiredInputs} = useGlobal()
  const inputs = INPUTS.filter(e => requiredInputs.includes(e.name))
  const form = useForm();

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

    addCustomer(form.getValues())
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <form onSubmit={form.handleSubmit(add)}>
        <DialogTitle>Add customer</DialogTitle>
        <DialogContent>
          <div className='flex flex-wrap'>
            {
              inputs.map(e => (
                <div className='w-1/2 px-2 pb-4' key={e.name}>
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


export const Customers = () => {
  const {customers, isLoading, setSelectedCustomerId} = useCustomer()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      {
        isDialogOpen && 
        <NewCustomerDialog isOpen={true} onClose={()=>setIsDialogOpen(false)}/>
      }
      <Card>
        <div className='flex items-center gap-3'>
          <div className='font-medium'>Choose a customer</div>
          <div>
            <Button onClick={()=>setIsDialogOpen(true)}>New customer</Button>
          </div>
        </div>
        <div className='mt-4 w-full'>
          {
            isLoading ? <>
              <div className='text-center'>Loading customers...</div>
            </> : <>
              {
                !customers || customers.length === 0 ? <div className='text-center'>No customers found</div>
                : <Select callback={setSelectedCustomerId} options={customers?.map(e=>({key: e._id, value: e.email}))}/>
              }
            </>
          }
        </div>
      </Card>
    </>
  )
}