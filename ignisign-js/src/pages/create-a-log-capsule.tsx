import { Button } from "../components-ui/button"
import { ApiService } from "../services/api.service"



export const CreateALogCapsulePage = () => {

  const doLogCapsule = async () => {
    // await ApiService.createSeal(selectedFiles[0])
    await ApiService.createLogCapsule()
  }

  return (
    <div>
      <Button onClick={doLogCapsule}>Create Log Capsule</Button>
    </div>)
}