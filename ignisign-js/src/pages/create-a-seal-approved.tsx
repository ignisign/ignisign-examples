import { useState } from "react";
import { Dropzone } from "../components-ui/dropzone"
import { Button } from "../components-ui/button";
import { ApiService } from "../services/api.service";
import { useHistory } from "react-router";
import { FrontUrlProvider } from "../utils/front-url-provider";
import Card from "../components-ui/card";
import { Snackbar } from "@material-ui/core";


export const SealApprovedPage = () => {
  const history = useHistory();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const signerId = '66c6ec75097bac1c1859dd36'

  const handleFileChange = (files : File[], fullPrivacy : boolean = false) => {
    const keepFiles = selectedFiles.filter(e=>e.fullPrivacy !== fullPrivacy)
    const newFiles = files.map(e=>({
      fullPrivacy,
      file: e
    }))
    setSelectedFiles([...keepFiles, ...newFiles]);
  };

  const doSeal = async () => {
    try {
      await ApiService.createSealSignatureRequest(signerId, selectedFiles[0])
      history.push(FrontUrlProvider.sealsPage())
    } catch (error) {
      
    }
  }

  const useTestFile = async () => {
    const filePath = '/dummy.pdf'
    
    const response = await fetch(filePath);
    const blob = await response.blob();
    
    const file = new File([blob], 'dummy.pdf', {type: 'application/pdf'});
    handleFileChange([file]);
  }

  return (
    <div>

          <div className='mt-4'>
            <Card className='flex-col'>
              <div className='font-medium'>Upload file to seal</div>
              <div className='mt-2 flex gap-2'>
                <Dropzone
                  onDrop={async files => handleFileChange(files)}
                  files={selectedFiles}
                  maxFiles={1}
                  multiple={false}
                />

                <Button onClick={useTestFile}>
                  Use a test file
                </Button>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={doSeal}>
                  Create seal
                </Button>
              </div>
            </Card>
          </div>

      {/* <div className="flex gap-2 item-center">
        <Dropzone
          onDrop={async files => handleFileChange(files)}
          files={selectedFiles}
          maxFiles={1}
          multiple={false}
        />

        <Button onClick={useTestFile}>
          Use a test file
        </Button>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={doSeal} disabled={!selectedFiles.length}>
          Create seal
        </Button>
      </div> */}
    </div>
  )
}