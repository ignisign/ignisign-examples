
export const Badge = ({children, success = false}) => {
  const color = success ? "green" : "red";

  return <div className="flex items-center">
    <div className={`text-${color}-500 text-xs py-1 px-2 bg-${color}-50 border-${color}-500 border rounded mr-2 flex`}>
      {children}
    </div>  
  </div>
}