import { Router } from "express"
import { NextFunction, Request, Response } from 'express';
import { FileService } from "../services/example/files.service";
import { IgnisignSdkManagerSigantureService } from "../services/ignisign/ignisign-sdk-manager-signature.service";
import { jsonSuccess } from "../utils/controller.util";
import { IgnisignDocument_PrivateFileDto } from "@ignisign/public";
import { MY_USER_TYPES } from "../models/user.db.model";


// const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID

export const appController = (router: Router) => {
  
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
      
      const webhooks         = await IgnisignSdkManagerSigantureService.getWebhookEndpoints();

      const employeeSignerProfileId = process.env.IGNISIGN_EMPLOYEE_SIGNER_PROFILE_ID;
      const customerSignerProfileId = process.env.IGNISIGN_CUSTOMER_SIGNER_PROFILE_ID;
      return jsonSuccess(res, { 
        [MY_USER_TYPES.EMPLOYEE]: {
          requiredInputs: await IgnisignSdkManagerSigantureService.getSignerInputsConstraintsFromSignerProfileId(employeeSignerProfileId),
          signerProfile: await IgnisignSdkManagerSigantureService.getSignerProfile(employeeSignerProfileId),
        },
        [MY_USER_TYPES.CUSTOMER]: {
          requiredInputs: await IgnisignSdkManagerSigantureService.getSignerInputsConstraintsFromSignerProfileId(customerSignerProfileId),
          signerProfile: await IgnisignSdkManagerSigantureService.getSignerProfile(customerSignerProfileId),
        },
        webhooks
      });

    } catch(e) { next(e) }
  })
  
  // This endpoint is used to consume the webhook sent by Ignisign.
  // You have to configurate it into the Ignisign Console.
  router.post('/v1/ignisign-webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await IgnisignSdkManagerSigantureService.consumeWebhook(req.body);
      jsonSuccess(res, result);
    } catch(e) { next(e) }
  })

}