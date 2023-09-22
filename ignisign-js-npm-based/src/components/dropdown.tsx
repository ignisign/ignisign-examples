import { InputLabel, MenuItem, Select } from '@mui/material'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  label: string
  callback
  name: string
  value
  items: {label, value}[]
}

const Dropdown = ({label, value, items, callback = null, name}: Props) => {
  return <div>
    <Select
      value={value ?? null}
      label={label}
      onChange={(e)=>{
        callback(e.target.value)
      }}
    >
      {
        items?.map(item=>{
          return <MenuItem value={item.value}>{item.label}</MenuItem>
        })
      }
    </Select>


  </div>
}

export default Dropdown