import { Router } from "express";
import { NextFunction, Request, Response } from 'express';
import { ContractService } from "../services/example/contract.service";
import { jsonError, jsonSuccess, MulterFile } from "../utils/controller.util";
import { deleteFile } from "../utils/files.util";
import {Readable} from 'stream'
import { Contract, ContractContext } from "../models/contract.db.model";

const multer    = require('multer');

const UPLOAD_TMP = 'uploads_tmp/'
const upload    = multer({ dest: UPLOAD_TMP });




// Example Controller to Manage contracts
export const ContractController = (router: Router) => {
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

  // This endpoint is used to retrieve all contracts context to sign for all users.
  router.get('/v1/contract-to-sign-contexts', async (req: Request, res: Response, next: NextFunction) => {
    try {

      const contracts: ContractContext[] = await ContractService.getAllContractToSignContexts()
      return jsonSuccess(res, contracts)
    } catch(e) { next(e) }
  })



  // This endpoint is used to create a new contract.
  // The file is uploaded in the same time.
  // the `ContractService.createNewContract` used bellow method hightly communicate with Ignisign SDK.
  router.post('/v1/contracts', upload.single('contractFile'), async (req: Request & { file: MulterFile }, res: Response, next: NextFunction) => { 

    let pathsToDelete = [];
    
    try {
      const { customerId, employeeId } = req.body;

      if(!customerId) 
        throw new Error('customerId is required')

      if(!employeeId) 
        throw new Error('employeeId is required')

      const contractFile = req.file
      pathsToDelete.push(`${contractFile.path}`)

      await ContractService.createNewContract(customerId, employeeId, contractFile)
      
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
