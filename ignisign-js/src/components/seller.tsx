import { Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components-ui/button";
import Card from "../components-ui/card";
import { Input } from "../components-ui/input";
import Select from "../components-ui/select";
import { useSeller } from "../contexts/seller.context";
import { useGlobal } from "../contexts/global.context";
import { INPUTS } from "../utils/inputs.utils";

const NewSellerDialog = ({isOpen, onClose}) => {
  const form                    = useForm();
  const {addSeller, isLoading}  = useSeller()
  const {requiredInputs}        = useGlobal()
  const inputs                  = INPUTS.filter(e => requiredInputs.includes(e.name))
  

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
    addSeller(form.getValues())
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <form onSubmit={form.handleSubmit(add)}>
        <DialogTitle>Create a new Seller</DialogTitle>
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

export const Sellers = () => {
  const {sellers, isLoading, setSelectedSellerId} = useSeller()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      {
        isDialogOpen && 
        <NewSellerDialog isOpen={true} onClose={()=>setIsDialogOpen(false)}/>
      }
      <Card className="flex-1 flex-col">
        <div className='flex items-center gap-3'>
          <div className='font-medium'>Choose a seller</div>
          <div>
            <Button onClick={()=>setIsDialogOpen(true)}>New seller</Button>
          </div>
        </div>
        <div className='mt-4 w-full'>
          {
            isLoading ? <>
              <div className='text-center'>Loading sellers...</div>
            </> : <>
              {
                !sellers || sellers.length === 0 ? <div className='text-center'>No sellers found</div>
                : <Select callback={setSelectedSellerId} options={sellers?.map(e=>({key: e._id, value: e.email}))}/>
              }
            </>
          }
        </div>
      </Card>
    </>
  )
}