import { useEffect, useState } from "react"
import { UploadRequest } from "./create-a-seal-approved"
import { useSeal } from "../../contexts/seal.context";
import { ApiService } from "../../services/api.service";
import { Button } from "../../components-ui/button";

export const CreateM2mSeal = () => {

  const {checkSetup, isEnabled, seals} = useSeal()

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [asPrivateFile, setAsPrivateFile] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (files : File[], fullPrivacy : boolean = false) => {
    const keepFiles = selectedFiles.filter(e=>e.fullPrivacy !== fullPrivacy)
    const newFiles = files.map(e=>({
      fullPrivacy,
      file: e
    }))
    setSelectedFiles([...keepFiles, ...newFiles]);
  };

  const reset = async () => {
    setSelectedFiles([])
  }

  const doSeal = async () => {
    setLoading(true)
    try {
      await ApiService.doM2MSeal(selectedFiles[0], asPrivateFile)
    } catch (error) {
      
    }
    setLoading(false)
  }

  return (
    <div>
      <h1>Create Seal</h1>

      <div>
        This demo is used to show how to create a signature signature request and complete it using machine to machine Ignisign feature
      </div>

      {
        !isEnabled && <div>
          Your backend is not setup yet to use this feature, you can follow this guide to setup your backend.

          {instructions.map(e => (
            <div key={e}>
              - {e}
            </div>
          ))}

          <Button onClick={checkSetup}>Re-check setup</Button>
        
        </div>
      }

      {
        isEnabled && <div>
          <UploadRequest
            doSeal={doSeal}
            handleFileChange={handleFileChange}
            selectedFiles={selectedFiles}
            disabled={!selectedFiles.length}
            setAsPrivateFile={setAsPrivateFile}
            asPrivateFile={asPrivateFile}
            loading={loading}
          />
        </div>
      }
    </div>
  )
}

const instructions = [
  'Create a new SEAL application in Ignisign console',
  'Create an API key for this application',
  'Fill the .env of your backend linked to Ignisign with the API key, the Environment and the SEAL application id. (IGNISIGN_SEAL_APP_ID, IGNISIGN_SEAL_ENV, IGNISIGN_SEAL_SECRET)',
]