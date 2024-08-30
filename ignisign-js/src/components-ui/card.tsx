
import React from 'react'

const Card = ({children, className = "", noFlex = false}) => {
  return (
    <div className={"border p-4 rounded bg-gray-50 " + className }>
      {children}
    </div>
  )
}

export default Card