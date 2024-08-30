

import { Router } from "express";
import { jsonSuccess, MulterFile } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/example/user.service";
import { MY_USER_TYPES, MyUser } from "../models/user.db.model";
import { IgnisignSdkManagerSignatureService } from "../services/ignisign/ignisign-sdk-manager-signature.service";
import { IgnisignSdkManagerSealService } from "../services/ignisign/ignisign-sdk-manager-seal.service";
import { SealService } from "../services/example/seal.service";
const crypto = require('crypto');
const fs = require('fs');
const multer    = require('multer');
  
function getFileHash(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const input = fs.createReadStream(filePath);

      input.on('error', reject);
      input.on('data', chunk => hash.update(chunk));
      input.on('end', () => resolve(hash.digest('hex')));
  });
}

const UPLOAD_TMP = 'uploads_tmp/'

const upload    = multer({ dest: UPLOAD_TMP });


export const SealController = (router: Router) => {

  
  router.post('/v1/seal-m2m-sign', upload.single('file'),
    async (req: Request & { file: MulterFile }, res: Response, next: NextFunction) => { 
      try {

        const { asPrivateFile } = req.body;
        const file = req.file;
        console.log("file", file, asPrivateFile)
        
      await SealService.createM2MSeal(file, Boolean(asPrivateFile));
        
        return jsonSuccess(res, true)
      } catch(e) { next(e) }
    })

    router.post('/v1/seal-creation/:signerId', upload.single('file'),
    async (req: Request & { file: MulterFile }, res: Response, next: NextFunction) => { 
      try {
        const file = req.file;
        const { asPrivateFile } = req.body;
        const { signerId } = req.params
        await SealService.createSealSignatureRequest(signerId, file, asPrivateFile);
        return jsonSuccess(res, true)
      } catch(e) { next(e) }
    })

  router.get('/v1/seal/get-app-m2m-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      return jsonSuccess(res, {isEnabled : IgnisignSdkManagerSealService.isEnabled() })
    } catch(e) { next(e) }
  })

  router.get('/v1/seals', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seals = await SealService.getSeals();
      return jsonSuccess(res, seals)
    } catch(e) { next(e) }
  })
  
} 