import { Router } from "express";
import { NextFunction, Request, Response } from 'express';
import { ContractService } from "../services/contract.service";
import { IgnisignSdkManagerService } from "../services/ignisign-sdk-manager.service";
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { deleteFile } from "../utils/files.util";
import {Readable, Writable} from 'stream'
import { Contract, ContractContext } from "../models/contract.db.model";

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

// Example Controller to Manage contracts
export const contractController = (router: Router) => {


  // This endpoint is used to retrieve about a contract for a specific user.  
  router.get('/v1/contracts/:contractId/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractId, userId } = req.params;

      const contractContext: ContractContext = await ContractService.getContractContextByUser(contractId, userId)
      
      return jsonSuccess(res, contractContext)
    } catch(e) { next(e) }
  })

  // This endpoint is used to retrieve all contracts for a specific user.
  router.get('/v1/user/:userId/contracts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      const contracts: Contract[] = await ContractService.getContracts(userId)
      return jsonSuccess(res, contracts)
    } catch(e) { next(e) }
  })


  // This endpoint is used to create a new contract.
  // The file is uploaded in the same time.
  // the `ContractService.createNewContract` used bellow method hightly communicate with Ignisign SDK.
  router.post('/v1/contracts', upload.single('contractFile'), async (req: Request & { file: MulterFile }, res: Response, next: NextFunction) => { 

    let pathsToDelete = [];
    
    try {
      const { customerId, sellerId } = req.body;

      if(!customerId) 
        throw new Error('customerId is required')

      if(!sellerId) 
        throw new Error('sellerId is required')

      const contractFile = req.file
      pathsToDelete.push(`${contractFile.path}`)

      await ContractService.createNewContract(customerId, sellerId, contractFile)
      
      jsonSuccess(res, { status: 'ok' })

    } catch (error) {

      console.error(error);
      jsonError(res, error)
    }
    finally {
      for (const pathToDelete of pathsToDelete) {
        deleteFile(pathToDelete)
      }
    }
  });

  // This endpoint is used to download the signature proof.
  router.get('/v1/contracts/:contractId/download-signature-proof', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractId } = req.params;
      const pdfStream: Readable = await ContractService.downloadSignatureProof(contractId)
      pdfStream.pipe(res).on('end', () => res.status(200).send())
    } catch(e) { next(e) }
    
  });
}
