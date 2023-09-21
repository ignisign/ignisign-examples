
import { Card as MaterialCard } from '@material-ui/core'
import React from 'react'

const Card = ({children, light = false}) => {
  return (
    <MaterialCard className={`flex-1 ${light ? 'bg-gray-500' : 'bg-gray-700'} p-4`}>
      {children}
    </MaterialCard>
  )
}

export default Card