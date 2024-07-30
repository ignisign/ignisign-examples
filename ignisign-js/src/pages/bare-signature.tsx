import { useEffect, useState } from "react";
import { Button } from '../components-ui/button';
import { ApiService } from "../services/api.service";
import { BARE_SIGNATURE_STATUS, BareSignature } from "../models/bare-signature.front-model";
import { BareSignatureCreation } from "./bare-signature-creation";
import axios from 'axios';
import { BareSignatureDisplayDialog } from "./bare-signature-document-display";

export const BareSignaturePage = () => {
  const [isLoading, setIsLoading]           = useState<boolean>(true);
  const [bareSignatures, setBareSignatures] = useState<BareSignature[]>([]);
  const [isInCreation, setIsInCreation]     = useState<boolean>(false);
  const [bareSignatureDisplayed, setBareSignatureDisplayed] = useState<BareSignature>(null);

  useEffect(() => {
    init();
  }, [])

  const init = async () => {
    setIsLoading(false);
    try {
      const tmpBareSignatures = await ApiService.getBareSignatures();
      setBareSignatures(tmpBareSignatures);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <BareSignatureDisplayDialog 
        bareSignature={bareSignatureDisplayed}
        removeBareSignature={() => setBareSignatureDisplayed(null)}
      />

      {isLoading && <div>Loading...</div>}
      
      {isInCreation && 
        <BareSignatureCreation 
          close={(bareSignature = null) => {
            if(bareSignature) 
              setBareSignatures([bareSignature, ...bareSignatures]);
            
            setIsInCreation(false);
          }}
        />
      }

      {!isLoading && !isInCreation && 
        <div>
          <div className="w-full flex justify-end mb-2">
            <Button onClick={() => setIsInCreation(true)}>
              Create Bare Signature
            </Button>
          </div>
          
          <div className="w-full flex flex-col gap-2">
            {bareSignatures.map((bareSignature) => (
              <BareSignatureItem 
                key={bareSignature._id} 
                bareSignature={bareSignature} 
                display={() => setBareSignatureDisplayed(bareSignature)}
              />
            ))}
          </div>
        </div>
      }
    </div>
  )
}

interface BareSignatureItemProps {
  bareSignature: BareSignature;
  display: () => void;
}

const BareSignatureItem = ({ bareSignature, display } : BareSignatureItemProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getProof = async () => {
    setIsLoading(true);
    try {
      const proof = await ApiService.bareSignatureGetProof(bareSignature._id);
      console.log('getProof : ', proof);
      // TODO  
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="flex w-full px-3 py-1.5 rounded border justify-between items-center">
      <span className="font-semibold">
        {bareSignature.title}
      </span>

      <div className="flex gap-3 items-center">
        <Button 
            onClick={display} 
            loading={isLoading}
          >
            {bareSignature.status === BARE_SIGNATURE_STATUS.SIGNED 
              ? 'View document'
              : 'Sign'
            }
        </Button>

        {bareSignature.status === BARE_SIGNATURE_STATUS.SIGNED && 
          <Button 
            onClick={getProof} 
            loading={isLoading}
          >
            Get Proof
          </Button>
        }
      </div>
    </div>
  )
}

