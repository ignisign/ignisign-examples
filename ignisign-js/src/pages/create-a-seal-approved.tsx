import { useState } from "react";
import { Dropzone } from "../components-ui/dropzone"
import { Button } from "../components-ui/button";
import { ApiService } from "../services/api.service";
import { useHistory } from "react-router";
import { FrontUrlProvider } from "../utils/front-url-provider";
import Card from "../components-ui/card";
import { Snackbar, Switch } from "@material-ui/core";
import { useSeal } from "../contexts/seal.context";


export const SealApprovedPage = () => {
  const history = useHistory();
  const {getSeals} = useSeal()

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [asPrivateFile, setAsPrivateFile] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setLoading(true)
      await ApiService.createSealSignatureRequest(signerId, selectedFiles[0], asPrivateFile)
      await getSeals()
      history.push(FrontUrlProvider.sealsPage())
    } catch (error) {
      
    }
    setLoading(false)
  }

  return (
    <div>
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
  )
}

export const UploadRequest = ({handleFileChange, selectedFiles, doSeal, disabled, asPrivateFile, setAsPrivateFile, loading}) => {

  const useTestFile = async () => {
    const filePath = '/dummy.pdf'
    
    const response = await fetch(filePath);
    const blob = await response.blob();
    
    const file = new File([blob], 'dummy.pdf', {type: 'application/pdf'});
    handleFileChange([file]);
  }

  return <>
    <div className='mt-4'>
      <Card className='flex-col'>
        <div className='font-medium'>
          Upload file to seal
        </div>

        <div className='mt-2 flex gap-2'>
          <Dropzone
            onDrop={async files => handleFileChange(files)}
            files={selectedFiles}
            maxFiles={1}
            multiple={false}
          />

          <div style={{alignContent: "center"}}>
            <Button onClick={useTestFile}>
              Use a test file
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className='font-medium'>
            Make file private
          </div>
          <Switch
            checked={asPrivateFile}
            onChange={() => setAsPrivateFile(!asPrivateFile)}
            name="checkedA"
          />
        </div>

      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={doSeal} disabled={disabled || loading} loading={loading}>
          Create seal
        </Button>
      </div>
    </div>
  </>
}