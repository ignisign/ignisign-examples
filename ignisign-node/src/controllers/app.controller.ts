import { Router } from "express"
import { NextFunction, Request, Response } from 'express';
import { FileService } from "../services/example/files.service";
import { IgnisignSdkManagerSignatureService } from "../services/ignisign/ignisign-sdk-manager-signature.service";
import { jsonSuccess } from "../utils/controller.util";
import { IGNISIGN_APPLICATION_TYPE, IgnisignDocument_PrivateFileDto } from "@ignisign/public";
import { MY_USER_TYPES } from "../models/user.db.model";
import { UserService } from "../services/example/user.service";
import { IgnisignInitializerService } from "../services/ignisign/ignisign-sdk-initializer.service";
import { IgnisignSdkManagerSealService } from "../services/ignisign/ignisign-sdk-manager-seal.service";
import { IgnisignSdkManagerBareSignatureService } from "../services/ignisign/ignisign-sdk-manager-bare-signature.service";


// const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID

export const AppController = (router: Router) => {
  
  // This endpoint is used to provide information about a private file. These information are transmetted to the IgnisignJS SDK (front end).
  router.get('/v1/files/:fileHash/private-file-info', async (req: Request, res: Response, next: NextFunction) => {
    try {        
      const {fileHash}  = req.params;
      const found : IgnisignDocument_PrivateFileDto = await FileService.getPrivateFileUrl(fileHash);

      return jsonSuccess(res, found)

    } catch(e) { next(e) }
  })
  

  // This endpoint is used to provide information to the Front-end example.
  // The requiredInputs are useful for many applications. It allows to know which information are required to create a signer.
  // The other information are more to help you to understand how to use the IgnisignJS SDK and are not transmitted to the front end in a real life application.
  router.get('/v1/app-context', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appContext = await IgnisignInitializerService.getAppContext(true);
      console.log("appContext", appContext)

      if(appContext.appType === IGNISIGN_APPLICATION_TYPE.SIGNATURE){
        const { employeeSignerProfileId, customerSignerProfileId } = await UserService.getSignerProfileIds(appContext.appType);
        const webhooks = await IgnisignSdkManagerSignatureService.getWebhookEndpoints();

        return jsonSuccess(res, { 
          [MY_USER_TYPES.EMPLOYEE]: await UserService.getConstraintsAndSignerProfileIds(employeeSignerProfileId),
          [MY_USER_TYPES.CUSTOMER]: await UserService.getConstraintsAndSignerProfileIds(customerSignerProfileId),
          webhooks,
          appContext
        });

      } else if (appContext.appType === IGNISIGN_APPLICATION_TYPE.SEAL){

        const { signerProfileId } = await UserService.getSignerProfileIds(appContext.appType);
        const webhooks = await IgnisignSdkManagerSealService.getWebhookEndpoints();

        return jsonSuccess(res, { 
          signerProfileInfos : await UserService.getConstraintsAndSignerProfileIds(signerProfileId),
          webhooks,
          appContext
        });

      } else if (appContext.appType === IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE){

        return jsonSuccess(res, { 
          appContext
        });
      } else if (appContext.appType === IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE){

        return jsonSuccess(res, { 
          appContext
        });

      } else {
        throw new Error(`appType ${appContext.appType} not supported`);
      }

    } catch(e) { next(e) }
  })
  
  // This endpoint is used to consume the webhook sent by Ignisign.
  // You have to configurate it into the Ignisign Console.
  router.post('/v1/ignisign-webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appContext = await IgnisignInitializerService.getAppContext(true);
      const services = {
        [IGNISIGN_APPLICATION_TYPE.SIGNATURE]: IgnisignSdkManagerSignatureService,
        [IGNISIGN_APPLICATION_TYPE.SEAL]: IgnisignSdkManagerSealService,
        [IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE]: IgnisignSdkManagerBareSignatureService,
        [IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE]: IgnisignSdkManagerSealService,
      }
      const result = services[appContext.appType].consumeWebhook(req.body);
      jsonSuccess(res, result);
    } catch(e) { next(e) }
  })

}