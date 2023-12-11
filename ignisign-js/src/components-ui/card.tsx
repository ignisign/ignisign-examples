
import React from 'react'

const Card = ({children, className = ""}) => {
  return (
    <div className={"border p-4 rounded bg-gray-50 flex " + className }>
      {children}
    </div>
  )
}

export default Card