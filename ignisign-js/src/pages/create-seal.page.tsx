import { useEffect, useState } from "react"
import { useSeal } from "../contexts/seal.context"
import Card from "../components-ui/card"
import { Dropzone } from "../components-ui/dropzone"
import { Button } from "../components-ui/button"
import { ApiService } from "../services/api.service"

export const CreateSeal = () => {

  const {checkSetup, isEnabled, seals} = useSeal()

  const [selectedFiles, setSelectedFiles] = useState([]);

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
    // await ApiService.createSeal(selectedFiles[0])
    await ApiService.createSealSignatureRequest()
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
                <div className='mt-4'>
        <Card className='flex-col'>
          <div className='font-medium'>Upload Contract</div>
          <div className='mt-2'>
            <Dropzone
              onDrop={async files => handleFileChange(files)}
              files={selectedFiles}
              maxFiles={1}
              multiple={false}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={doSeal}>
              Create seal
            </Button>
          </div>
        </Card>
      </div>

      <div>
            My seals
          </div>
          
          {
            seals.length === 0 ? <div>
              You don't have any seals yet
            </div> : <>
              {seals.map(e => (
                <div key={e.id}>
                  {e.id}
                </div>
              ))}

              
            </>
          }
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