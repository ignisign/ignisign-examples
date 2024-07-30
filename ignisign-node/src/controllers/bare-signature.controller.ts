import { Router } from "express";
import { NextFunction, Request, Response } from 'express';
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { BareSignatureService } from "../services/bare-signature.service";
import { deleteFile } from "../utils/files.util";

const UPLOAD_TMP = 'uploads_tmp/';
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

      const title = req.body.title;
      const file  = req.file;

      const bareSignature = await BareSignatureService.createBareSignature(title, file);
      jsonSuccess(res, bareSignature);

    } catch (error) {
      console.error(error);
      jsonError(res, error)
    } finally {
      if(req?.file) {
        deleteFile(req.file.path);
      }
    }

  });

  router.get('/v1/bare-signatures', 
    async (req: Request, res: Response, next: NextFunction) => {

      try {
        const allBareSignatures = await BareSignatureService.getBareSignatures();
        jsonSuccess(res, allBareSignatures);
      } catch (e) {
        console.error(e);
        next(e);
      }
    }
  );

  // router.get('/v1/bare-signatures/:bareSignatureId/login', 
  //   async (req: Request, res: Response, next: NextFunction) => {

  //     try {
  //       const { bareSignatureId } = req.params;
  //       const redirectUrl = await BareSignatureService.login(bareSignatureId);
  //       jsonSuccess(res, { redirectUrl });
  //     } catch (e) {
  //       console.error(e);
  //       next(e);
  //     }
  //   }
  // );

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

  // router.get('/v1/bare-signatures/:bareSignatureId/download',
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     try {
  //       const { bareSignatureId } = req.params;
  //       const stream = await BareSignatureService.download(bareSignatureId);
        
  //       stream
  //         .pipe(res)
  //         .on('end', () => res.status(200).send())
  //         .on('error', (e) => {
  //           console.error(e);
  //           next(e);
  //         });

  //     } catch (e) {
  //       console.error(e);
  //       next(e);
  //     }
  //   }
  // );


}


