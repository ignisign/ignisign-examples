
import { InputLabel, MenuItem, Select, TextField } from "@mui/material"
import { UseFormReturn } from "react-hook-form"

type IInputProps = {
  label      : string
  form       : UseFormReturn<any>
  name       : string
  className ?: string
  type      ?: string
  dataset   ?: {label: string, value: string}[]
  required  ?: boolean
}

export const Input = ({label, form, name, className = '', type = 'text', dataset = [], required = false }: IInputProps) => {

  const onChange = (e) => form.setValue(name, e.target.value);

  return (
    <div className={className}>
      {
        type === 'select' ? 
          <>
            <InputLabel id={`${label}-label`}>{label}</InputLabel>
            <Select 
              labelId={`${label}-label`} 
              onChange={onChange}
              defaultValue={form.getValues(name)}
              className="w-full">
                {dataset?.map((d, i) => 
                  <MenuItem key={`input-${name}-${i}-${d.label}`} value={d.value}>{d.label}</MenuItem>
                )}
            </Select>
          </> : 
          <TextField
            fullWidth
            type={type}
            label={type === 'date' ? null : label}
            error={!!form.formState.errors[name]}
            {...form.register(name, {required})}
            onChange={onChange}
          />
      }
    </div>
  )
}