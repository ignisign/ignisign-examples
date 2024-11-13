import { useEffect, useState } from "react"
import { UploadRequest } from "./create-a-seal-approved"
import { useSeal } from "../../contexts/seal.context";
import { ApiService } from "../../services/api.service";
import { Button } from "../../components-ui/button";
import FileSaver from 'file-saver';
import { XMLValidator } from 'fast-xml-parser';
import mime from 'mime';
import { Snackbar, Alert } from '@mui/material';
import { Dropzone } from "../../components-ui/dropzone";
import Card from "../../components-ui/card";

enum InputType {
  FILE = 'FILE',
  FILE_PRIVATE = 'FILE_PRIVATE',
  JSON = 'JSON',
  XML = 'XML'
}

const MESSAGES = {
  TITLE: 'Create Seal',
  DESCRIPTION: 'This demo is used to show how to create a signature request and complete it using machine to machine Ignisign feature',
  SETUP_REQUIRED: 'Your backend is not setup yet to use this feature, you can follow this guide to setup your backend.',
  JSON_INVALID: 'Invalid JSON format',
  XML_INVALID: 'Invalid XML format',
  FILE_ERROR: 'Error processing file',
  SELECT_INPUT_TYPE: 'Select the type of input you want to use',
  UPLOAD_SUCCESS: 'File uploaded successfully',
  SEAL_ERROR: 'Error creating seal',
  UPLOAD_FILE_TO_SEAL: 'Upload file to seal',
  UPLOAD_PRIVATE_FILE_TO_SEAL : 'Upload file to seal',
  USE_TEST_JSON: 'Use test JSON',
  USE_TEST_XML: 'Use test XML',
  SETUP_INSTRUCTIONS: [
    'Create a new SEAL application in Ignisign console',
    'Create an API key for this application',
    'Fill the .env of your backend linked to Ignisign with the API key, the Environment and the SEAL application id. (IGNISIGN_SEAL_APP_ID, IGNISIGN_SEAL_ENV, IGNISIGN_SEAL_SECRET)',
  ]
};

export const CreateM2mSeal = () => {
  const { checkSetup, isEnabled, seals } = useSeal();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputType, setInputType] = useState(InputType.FILE);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (inputType === InputType.FILE || inputType === InputType.FILE_PRIVATE) {
      setDisabled(!selectedFiles.length);
    } else {
      setDisabled(!textInput.trim());
    }
  }, [selectedFiles, textInput, inputType]);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const useTestJson = () => {
    const testJson = JSON.stringify({
      test: "Hello World",
      number: 42,
      nested: { key: "value" }
    }, null, 2);
    setTextInput(testJson);
  };

  const useTestXml = () => {
    const testXml = `<?xml version="1.0" encoding="UTF-8"?>
      <root>
        <test>Hello World</test>
        <number>42</number>
        <nested>
          <key>value</key>
        </nested>
      </root>`;
    setTextInput(testXml);
  };


  const validateInput = () => {
    try {
      if (inputType === InputType.JSON) {
        JSON.parse(textInput);
        return true;
      } else if (inputType === InputType.XML) {
        const result = XMLValidator.validate(textInput);
        if (result !== true) {
          throw new Error(result.err.msg);
        }
        return true;
      }
      return true;
    } catch (error) {
      showSnackbar(
        `${inputType === InputType.JSON ? MESSAGES.JSON_INVALID : MESSAGES.XML_INVALID}: ${error.message}`,
        'error'
      );
      return false;
    }
  };

  const useTestFile = async () => {
    const filePath = '/dummy.pdf'
    
    const response = await fetch(filePath);
    const blob = await response.blob();
    
    const file = new File([blob], 'dummy.pdf', {type: 'application/pdf'});
    handleFileChange([file]);
  }

  const handleFileChange = (files: File[]) => {
    try {
      const newFiles = files.map(file => ({
        fullPrivacy: inputType === InputType.FILE_PRIVATE,
        file,
        mimeType: mime.getType(file.name) || 'application/octet-stream'
      }));
      setSelectedFiles([...newFiles]);
      showSnackbar(MESSAGES.UPLOAD_SUCCESS);
    } catch (error) {
      showSnackbar(`${MESSAGES.FILE_ERROR}: ${error.message}`, 'error');
    }
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(event.target.value);
  };

  const reset = () => {
    setSelectedFiles([]);
    setTextInput('');
  };

  const getProofExtension = (mimeType: string) => {
    if (inputType === InputType.FILE_PRIVATE) {
      if(mimeType === 'application/pdf') {
        return 'cades.der';
      } else {
        return 'xades.xml';
      }
    } else if (inputType === InputType.FILE) {
      if(mimeType === 'application/pdf') {
        return 'pdf';
      } else {
        return 'xades.xml';
      }
    } else if (inputType === InputType.JSON) {
      return 'jws';
    } else if (inputType === InputType.XML) {
      return 'xades.xml';
    } else {
      return 'pdf';
    }
  }

  const doSeal = async () => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      let content;
      if (inputType === InputType.JSON || inputType === InputType.XML) {
        const blob = new Blob([textInput], {
          type: inputType === InputType.JSON ? 'application/json' : 'application/xml'
        });
        content = { file: blob };
      } else {
        content = selectedFiles[0];
      }

      const blob = await ApiService.doM2MSeal(content, inputType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seal-m2m-proof.${getProofExtension(content.mimeType)}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showSnackbar(`${MESSAGES.SEAL_ERROR}: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>{MESSAGES.TITLE}</h1>
      <div>{MESSAGES.DESCRIPTION}</div>

      {!isEnabled ? (
        <div>
          {MESSAGES.SETUP_REQUIRED}
          {MESSAGES.SETUP_INSTRUCTIONS.map(instruction => (
            <div key={instruction}>- {instruction}</div>
          ))}
          <Button onClick={checkSetup}>Re-check setup</Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="mt-4">
            {MESSAGES.SELECT_INPUT_TYPE}
          </div>

            <select value={inputType} onChange={(e) => setInputType(e.target.value as InputType)} className="w-full h-10 border border-gray-300 rounded-md p-2 mb-4">
              <option value={InputType.FILE}>File Upload</option>
            <option value={InputType.FILE_PRIVATE}>Private File Upload</option>
            <option value={InputType.JSON}>JSON Input</option>
            <option value={InputType.XML}>XML Input</option>
          </select>

          {(inputType === InputType.FILE || inputType === InputType.FILE_PRIVATE) ? (
            <>
            <div className='mt-4'>
              <Card className='flex-col'>
                <div className='font-medium'>
                  {inputType === InputType.FILE ? MESSAGES.UPLOAD_FILE_TO_SEAL : MESSAGES.UPLOAD_PRIVATE_FILE_TO_SEAL}
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
        
               
        
              </Card>
        
              <div className="flex justify-end mt-4">
                <Button onClick={doSeal} disabled={disabled || loading} loading={loading}>
                  Create seal
                </Button>
              </div>
            </div>
          </>
          ) : (
            <div>
               <div className="flex gap-2 mb-4">
                  <Button onClick={inputType === InputType.JSON ? useTestJson : useTestXml}>
                    {inputType === InputType.JSON ? MESSAGES.USE_TEST_JSON : MESSAGES.USE_TEST_XML}
                  </Button>
              </div>
              <textarea
                className="w-full h-40 border border-gray-300 rounded-md p-2"
                value={textInput}
                onChange={handleTextInputChange}
                placeholder={`Enter your ${inputType.toLowerCase()} here...`}
                rows={10}
                cols={50}
              />
              <Button 
                onClick={doSeal}
                disabled={!textInput.trim()}
                loading={loading}
              >
                Create Seal
              </Button>
            </div>
          )}
        </div>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity as 'success' | 'error'} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};