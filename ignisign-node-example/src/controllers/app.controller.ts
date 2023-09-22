import { Router } from "express"
import { NextFunction, Request, Response } from 'express';
import { FileService } from "../services/files.service";
import { IgnisignSdkManagerService } from "../services/ignisign-sdk-manager.service";
import { jsonSuccess } from "../utils/controller.util";

export const appController = (router: Router) => {
  
  router.get('/v1/files/:fileHash', async (req: Request, res: Response, next: NextFunction) => {
    try {        
      const {fileHash} = req.params
      const found = await FileService.getPrivateFileUrl(fileHash)
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })
  
  router.get('/v1/app-context', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID
      const inputs = await IgnisignSdkManagerService.getSignatureProfileSignerInputsConstraints(signatureProfileId);
      const signatureProfile = await IgnisignSdkManagerService.getSignatureProfile(signatureProfileId);
      return jsonSuccess(res, {
        requiredInputs: inputs,
        signatureProfile,
        webhooks: await IgnisignSdkManagerService.getWebhookEndpoints()
      });
    } catch(e) { next(e) }
  })
  
  router.post('/v1/ignisign-webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await IgnisignSdkManagerService.consumeWebhook(req.body);
      jsonSuccess(res, result);
    } catch(e) { next(e) }
  })

}