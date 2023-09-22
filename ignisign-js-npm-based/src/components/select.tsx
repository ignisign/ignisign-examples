import React from 'react'

type Select = {
  options: {key, value}[]
}

const Select = ({options = [], callback}) => {
  return (
    <select className='h-8 w-full' onChange={(e)=>callback(e.target.value)}>
      {/* w-32 */}
      {
        options.map(e=>{
          return <option key={e.key} value={e.key}>{e.value}</option>
        })
      }
    </select>
  )
}

export default Select