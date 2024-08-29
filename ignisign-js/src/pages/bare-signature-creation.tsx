import { useState } from "react";
import { Dropzone } from "../components-ui/dropzone";
import { Button } from '../components-ui/button';
import { ApiService } from "../services/api.service";
import { BareSignature } from "../models/bare-signature.front-model";
import { TextField } from "@material-ui/core";
import * as uuid from "uuid";

interface BareSignatureCreationProps {
  close: ( bareSignature ?: BareSignature) => void;
}

export const BareSignatureCreation = ({ close } : BareSignatureCreationProps) => {
  const [title, setTitle]                     = useState<string>('BareSignature-' + uuid.v4());
  const [selectedFile, setSelectedFile]       = useState<File>(null);
  const [isLoading, setIsLoading]             = useState<boolean>(false);
  
  const createBareSignature = async () => {
    try {
      setIsLoading(true);
      const savedBareSignature = await ApiService.bareSignatureUploadFile(title, selectedFile);
      console.log('createBareSignature : ', savedBareSignature);
      close(savedBareSignature);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="flex flex-col gap-10 mt-12">
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Dropzone
        onDrop={async files => setSelectedFile(files[0])}
        files={[selectedFile]}
        maxFiles={1}
        multiple={false}
      />

      <div className="w-full flex items-center gap-5 justify-between">
        <Button 
            onClick={() => close()}
            disabled={isLoading} 
          >
            Cancel
        </Button>

        <Button 
          onClick={createBareSignature}
          disabled={!selectedFile || !title} 
          loading={isLoading}
        >
          Create Bare Signature
        </Button>
      </div>
    </div>
  )
}