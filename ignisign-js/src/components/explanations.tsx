
import React, {useEffect, useState} from "react";
import { useGlobal } from "../contexts/global.context";
import Card from "../components-ui/card";
import { IGNISIGN_APPLICATION_TYPE, IGNISIGN_INTEGRATION_MODE, IgnisignWebhook } from "@ignisign/public";
import { Example_AC_Seal, Example_AC_Signature } from "../models/global.front-model";


export function ExplanationHome1() {
  return (<>
      <Card className="mb-8 flex-col justify-center items-center">
        <div className="text-2xl text-center">This is an example showcasing how to use <br/>the Ignisign SDK to sign documents</div>
        <div className="mt-2">
          This is a sample app showcasing how a seller and a customer can interact to sign a contract efficiently using the IgniSign Signature service.<br/>
        </div>
        <div>
          <a href="https://doc.ignisign.io/" target="_blank" className="text-blue-500 hover:underline cursor-pointer">Learn more about IgniSign</a>
        </div>
      </Card>
      
      <Card className="flex-col">
        <div className="text-lg font-semibold mb-2">
          What the app does
        </div>
        <div>- You can create employees and customers.</div>
        <div>- You can create a contract between an employee and a customer.</div>
        <div>- Both parties can electronically sign the contract using IgniSign.</div>
        <div>- After both signed the contract, they can retrieve the signature proof.</div>
       
      </Card>
      
      
  </>)
}


export function Explanation_Embedded_BySide(){
  const {isAppSeal, isAppSignature, appContext} = useGlobal();

  const [isEmbedded, setIsEmbedded] = useState(false);
  const [ webhooks, setWebhooks] = useState<IgnisignWebhook[]>([]);
  
  useEffect(() => {
    if (!isAppSeal && isAppSignature)
      return
     
    if(isAppSeal){
      const appSealContext = appContext as Example_AC_Seal;
      setWebhooks(appSealContext?.webhooks)
      setIsEmbedded(appSealContext?.signerProfileInfos?.signerProfile.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED)
    }

    if(isAppSignature){
      const appSignatureContext = appContext as Example_AC_Signature;
      setWebhooks(appSignatureContext?.webhooks)
      setIsEmbedded(appSignatureContext?.CUSTOMER?.signerProfile.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED 
                 || appSignatureContext?.EMPLOYEE?.signerProfile.integrationMode === IGNISIGN_INTEGRATION_MODE.EMBEDDED)
    }

  }, [isAppSeal, isAppSignature, appContext])


  if(!isAppSeal && !isAppSignature)
    return <></>

  return (<div>
    <div className="flex-col">
      {(isEmbedded)? 
        <>
          <div className="">This signature profile is in <span className="font-semibold">embbeded mode.</span></div>
          <div>Webhooks are <span className="font-semibold">required</span> to handle signature token of signers and provide them through iframe</div>
          { (webhooks?.length > 0) ? 
            <>
              <div className="font-semibold mt-4">Webhooks that are configurated:</div>
              <div>{webhooks.map(e=>e.url).join(', ')}</div>
            </> : 
            <>
              <div>No webhook registered. </div>
            </>
          }
        </> : 
        <>
          <div>This signature profile is in <span className="font-semibold">by side mode</span>.</div>
          <div>Users will receive emails to sign the contract </div>
         
        </>
      }
    </div>
  </div>)
}

export function Explanation_IsPrivateFile(){
  const {isFilesPrivates} = useGlobal();

  if(!isFilesPrivates)
    return <></>

  return (
    
      <div className="flex-col mt-2 ">
        <div className="font-semibold">Private Files</div>
        <div>This signature profile is in private mode. Files will be not be stored in Ignisign</div>
        <div>You will need to handle the files by yourself and send through the Iframe to let Ignisign display them</div>
    </div>)
}