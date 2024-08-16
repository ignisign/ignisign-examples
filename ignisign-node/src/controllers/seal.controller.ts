

import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/example/user.service";
import { MY_USER_TYPES, MyUser } from "../models/user.db.model";
import { IgnisignSdkManagerSigantureService } from "../services/ignisign/ignisign-sdk-manager-signature.service";
import { IgnisignSdkManagerSealService } from "../services/ignisign/ignisign-sdk-manager-seal.service";
const crypto = require('crypto');
const fs = require('fs');
  
function getFileHash(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const input = fs.createReadStream(filePath);

      input.on('error', reject);
      input.on('data', chunk => hash.update(chunk));
      input.on('end', () => resolve(hash.digest('hex')));
  });
}

// Example Controller used to manage customers
export const sealController = (router: Router) => {

  // retrieve all customers
  router.post('/v1/seal/sign', async (req: Request, res: Response, next: NextFunction) => {
    try {
      
        const filePath = global['appRoot'] + '/dummy.pdf';
        const fileHash: any = await getFileHash(filePath);
        await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileHash);
      
      return jsonSuccess(res, true)
    } catch(e) { next(e) }
  })

  router.get('/v1/seal/get-app-m2m-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
    
      console.log('IgnisignSdkManagerSealService.isEnabled', IgnisignSdkManagerSealService.isEnabled())
      return jsonSuccess(res, {isEnabled : IgnisignSdkManagerSealService.isEnabled() })
    } catch(e) { next(e) }
  })
  
} 