import { Router } from "express";
import { NextFunction, Request, Response } from 'express';
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { getFileHash } from "../utils/files.util";
import * as fs from 'fs';
import { BARE_SIGNATURE_STATUS, BareSignature, BareSignatureModel } from "../models/bare-signature.db.model";
import { BareSignatureService } from "../services/bare-signature.service";

const UPLOAD_TMP = 'uploads/'
const multer     = require('multer');
const upload     = multer({ dest: UPLOAD_TMP });

// https://github.com/expressjs/multer/issues/343
export interface MulterFile {
  path          : string 
  mimetype      : string
  originalname  : string
  size          : number
}

export const bareSignatureController = (router: Router) => {

  router.post('/v1/bare-signatures/upload-file', 
    upload.single('file'), async (req: Request & { file: MulterFile }, res: Response, next: NextFunction) => { 
    try {
      console.log('bareSignatureController : ', req.file);

      const filePath = req.file.path;
      const fileHash = await getFileHash(fs.createReadStream(req.file.path));
      const codeVerifier = BareSignatureService.generateCodeVerifier();

      const bareSignatureToCreate : BareSignature = {
        documents    : [{ documentPath: filePath, documentHash: fileHash }],
        accessToken  : '',
        status       : BARE_SIGNATURE_STATUS.INIT,
        codeVerifier
      };

      const savedBareSignature = await new Promise<BareSignature>((resolve, reject) => {
        BareSignatureModel.insert(bareSignatureToCreate,  async (error, inserted) => {
          if(error) {
            console.error(error);
            reject(error);
            return;
          }

          if(!inserted || !inserted.length) {
            reject(new Error("BareSignature not inserted"));
            return;
          }

          resolve(inserted[0]);
        });
      });
      
      jsonSuccess(res, savedBareSignature);

    } catch (error) {
      console.error(error);
      jsonError(res, error)
    }

  });

  router.get('/v1/bare-signatures/:bareSignatureId/login', 
    async (req: Request, res: Response, next: NextFunction) => {

      try {
        const { bareSignatureId } = req.params;
        const redirectUrl = await BareSignatureService.login(bareSignatureId);
        jsonSuccess(res, { redirectUrl });
      } catch (e) {
        console.error(e);
        next(e);
      }
    }
  );

  router.post('/v1/bare-signatures/:bareSignatureId/save-access-token', 
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { bareSignatureId } = req.params;
        const { token } = req.body;

        await BareSignatureService.saveAccessToken(bareSignatureId, token);
        jsonSuccess(res, { success: true});
      } catch (e) {
        console.error(e);
        next(e);
      }
    }
  );

  router.get('/v1/bare-signatures/:bareSignatureId/proof', 
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { bareSignatureId } = req.params;
        const proof = await BareSignatureService.getProof(bareSignatureId);
        jsonSuccess(res, proof);
      } catch (e) {
        console.error(e);
        next(e);
      }
    }
  );


}


