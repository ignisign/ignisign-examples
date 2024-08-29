import { useEffect, useState } from "react"
import { useSeal } from "../contexts/seal.context"
import Card from "../components-ui/card"
import { Dropzone } from "../components-ui/dropzone"
import { Button } from "../components-ui/button"
import { ApiService } from "../services/api.service"
import { useHistory } from "react-router"
import { FrontUrlProvider } from "../utils/front-url-provider"
import { Badge, Typography } from "@material-ui/core"
import { IGNISIGN_SIGNATURE_REQUEST_TYPE } from "@ignisign/public"

export const Seals = () => {
  const history = useHistory();

  const {
    checkSetup, 
    isEnabled, 
    seals,
    isSealLoading,
    isSealInit,
    getSeals,
  } = useSeal()

  const goToCreateSeal = async () => {
    
  }

  console.log(seals);
  

  if (!isSealInit) {
    return <div>
      Loading...
    </div>
  }

  return (
    <div>
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

          <div className="flex justify-between item-center mb-3">
            <Typography variant="h4">
              My seals
            </Typography>

            <div className="flex gap-2">
              <Button onClick={getSeals}>Refresh</Button>
              <Button onClick={() => history.push(FrontUrlProvider.createM2MSeal())}>Create Seal - M2M</Button>
              <Button onClick={() => history.push(FrontUrlProvider.createSealApproved())}>Create Seal - Manual</Button>
            </div>
          </div>
          
          {
            seals.length === 0 ? <div>
              You don't have any seals yet
            </div> : <>
              {seals.map(e => (
                <Card key={e._id} className="flex item-center mb-2 relative">
                  <div className="absolute right-16">
                    <Badge color="secondary" badgeContent={e.status} overlap="rectangular"/>
                  </div>
                  <div className="ml-6">
                    <Badge color="primary" badgeContent={e.signatureRequestType === IGNISIGN_SIGNATURE_REQUEST_TYPE.SEAL ? 'Manual' : 'M2M'} overlap="rectangular"/>
                  </div>
                    <div className="ml-10">
                      {e.title}
                    </div>
                  {/* <Badge color="primary"> */}
                  {/* </Badge> */}
                </Card>
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