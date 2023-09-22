import React from 'react'

type SelectType = {
  options: {key, value}[]
  callback: (e: string) => any
}

const Select = ({options = [], callback}: SelectType) => {

  return (
    <select className='h-8 w-full' onChange={(e)=>callback(e.target.value)}>
      {
        options.map(e=>{
          return <option key={e.key} value={e.key}>{e.value}</option>
        })
      }
    </select>
  )
}

export default Select