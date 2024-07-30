import { useEffect, useState } from "react";
import { Dropzone } from "../components-ui/dropzone";
import { Button } from '../components-ui/button';
import { BareSignature } from "../models/bare-signature.front-model";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@material-ui/core";
import axios from 'axios';
import { ApiService } from "../services/api.service";

interface BareSignatureDisplayDialogProps {
  bareSignature        : BareSignature;
  removeBareSignature ?: () => void;
}

export const BareSignatureDisplayDialog = ({ bareSignature, removeBareSignature } : BareSignatureDisplayDialogProps) => {
  const [isLoading, setIsLoading]                   = useState<boolean>(true);
  const [localBareSignature, setLocalBareSignature] = useState<BareSignature>(null);

  useEffect(() => {
    console.log('bareSignature : ', bareSignature);

    if(!!bareSignature){ 
      // To keep data display while closing the dialog
      downloadDocument();
      setLocalBareSignature(bareSignature);
    }
      
  }, [bareSignature])

  useEffect(() => {
    if(localBareSignature) 
      downloadDocument();
  }, [localBareSignature])
  

  const downloadDocument = async () => {
    try {
      const documentBlob = await ApiService.downloadBareSignatureDocument(localBareSignature._id);
    
      const url = window.URL.createObjectURL(
        documentBlob
        // new Blob([response])
        );
        
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'test'); 
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error(e);
    }
  }
  
  const goSign = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = (await axios.get(bareSignature.authorizationUrl))?.data
      window.location.href = redirectUrl;
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Dialog open={!!bareSignature} onClose={removeBareSignature} maxWidth="md" fullWidth>
      <DialogTitle>
        {localBareSignature?.title}
      </DialogTitle>

      <DialogContent>
        <div>
          TODO
        </div>
      </DialogContent>

      <DialogActions>
        <div className="w-full flex items-center gap-5 justify-between">
          <Button onClick={removeBareSignature} disabled={isLoading}>
            Close
          </Button>

          <Button onClick={goSign} loading={isLoading}>
            Sign
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  )
}

const BareSignatureDocumentViewer = ({ bareSignature } : { bareSignature : BareSignature }) => {

  return (
    <div>

    </div>
  )
}