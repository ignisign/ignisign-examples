

import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/user.service";
import { MY_USER_TYPES, MyUser } from "../models/user.db.model";
import { IgnisignSdkManagerService } from "../services/ignisign-sdk-manager.service";
import { IgnisignM2MSdkManagerService } from "../services/ignisign-m2m-manager.service";
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
        const m2mId = process.env.IGNISIGN_SEAL_M2M_ID;
        await IgnisignM2MSdkManagerService.createM2mSignatureRequest(m2mId, fileHash);
      
      return jsonSuccess(res, true)
    } catch(e) { next(e) }
  })

  router.get('/v1/seal/get-app-m2m-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
    
      console.log('IgnisignM2MSdkManagerService.isEnabled', IgnisignM2MSdkManagerService.isEnabled())
      return jsonSuccess(res, {isEnabled : IgnisignM2MSdkManagerService.isEnabled() })
    } catch(e) { next(e) }
  })
  
} 