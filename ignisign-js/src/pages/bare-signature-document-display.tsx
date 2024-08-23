import { useEffect, useState } from "react";
import { Button } from '../components-ui/button';
import { BARE_SIGNATURE_STATUS, BareSignature, BareSignatureDocument } from "../models/bare-signature.front-model";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core";
import axios from 'axios';
import { ApiService } from "../services/api.service";
interface BareSignatureDisplayDialogProps {
  bareSignature        : BareSignature;
  removeBareSignature ?: () => void;
}

export const BareSignatureDisplayDialog = ({ bareSignature, removeBareSignature } : BareSignatureDisplayDialogProps) => {
  const [isLoading, setIsLoading]                   = useState<boolean>(false);
  const [localBareSignature, setLocalBareSignature] = useState<BareSignature>(null);

  
  useEffect(() => {
    if(!!bareSignature){ 
      // To keep data display while closing the dialog
      setLocalBareSignature(bareSignature);
    }
      
  }, [bareSignature])

  const goSign = async () => {
    setIsLoading(true);
    try {
      const authorizationUrl = await ApiService.getAuthorizationUrl(bareSignature._id);
      console.log('BareSignatureDisplayDialog : ', { authorizationUrl });
      window.location.href = authorizationUrl;
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={!!bareSignature} onClose={removeBareSignature} maxWidth="md" fullWidth>
      <DialogTitle className="text-center">
        {localBareSignature?.title}
      </DialogTitle>

      <DialogContent>
        <div className="w-full max-w-2xl mx-auto">
          <BareSignatureDocumentViewer doc={localBareSignature?.document} />
        </div>
      </DialogContent>

      <DialogActions>
        <div className="w-full flex items-center gap-5 justify-between">
          <Button onClick={removeBareSignature} disabled={isLoading}>
            Close
          </Button>

          {localBareSignature?.status !== BARE_SIGNATURE_STATUS.SIGNED &&
            <Button onClick={goSign} loading={isLoading}>
              Sign
            </Button>
          }
        </div>
      </DialogActions>
    </Dialog>
  )
}

const BareSignatureDocumentViewer = ({ doc } : { doc : BareSignatureDocument }) => {
  
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
      
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  const docDataUrl = () => {
    const blob = b64toBlob(doc.fileB64, doc.mimeType);
    return URL.createObjectURL(blob);
  
  }
  enum DOC_TYPE {
    IMAGE   = 'IMAGE',
    PDF     = 'PDF',
    UNKNOWN = 'UNKNOWN'
  }

  function classifyDocument(mimeType: string) {
    if(mimeType?.startsWith('image/')) {
      return DOC_TYPE.IMAGE;
    } else if (mimeType === 'application/pdf') {
      return DOC_TYPE.PDF;
    } else {
      return DOC_TYPE.UNKNOWN;
    }
  }
  const docType = classifyDocument(doc?.mimeType);

  return (
    <div>
      {docType === DOC_TYPE.IMAGE && /* B64 */
        <img src={`data:image/png;base64, ${doc.fileB64}`} alt={doc.fileName} />
      }

      {docType === DOC_TYPE.PDF &&
          <iframe
          src={`data:application/pdf;base64,${doc.fileB64}`}
          // src={docDataUrl()}
          title="PDF Viewer"
          width="100%"
          height="600px"
          style={{ border: 'none' }}
        />
      }

      {docType === DOC_TYPE.UNKNOWN &&
        <div className="p-3 border-2 rounded text-center">
          For the purposes of this example, we have not implemented the display of files other than images and PDFs.
        </div>
        }
    </div>
  )
}