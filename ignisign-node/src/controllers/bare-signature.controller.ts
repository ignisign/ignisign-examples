import { Router } from "express";
import { NextFunction, Request, Response } from 'express';
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { getFileHash } from "../utils/files.util";
import * as fs from 'fs';
import { BARE_SIGNATURE_STATUS, BareSignature, BareSignatureModel } from "../models/bare-signature.db.model";


const UPLOAD_TMP = 'uploads_tmp/'
const multer    = require('multer');
const upload    = multer({ dest: UPLOAD_TMP });


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
      const filePath = req.file.path;
      const fileHash = await getFileHash(fs.createReadStream(req.file.path))

      const bareSignatureToCreate : BareSignature = {
        documents   : [{ documentPath: filePath, documentHash: fileHash }],
        accessToken : '',
        status      : BARE_SIGNATURE_STATUS.INIT
      };

      const savedBareSignature = await new Promise<BareSignature>((resolve, reject) => {
        BareSignatureModel.insert(bareSignatureToCreate,  async (error, inserted) => {
          if(error) {
            console.error(error);
            reject(error);
            return;
          }

          if(!inserted || !inserted.length) {
            reject(new Error("User not inserted"));
            return;
          }
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
        // TODO
        
      } catch (e) {
        next(e);
      }
    }
  );


}


