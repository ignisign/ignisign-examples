import { Router } from "express";
import { ContractService } from "../services/contract.service";
import { IgnisignSdkManagerService } from "../services/ignisign-sdk-manager.service";
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { deleteFile } from "../utils/files.util";
import {Readable, Writable} from 'stream'

const UPLOAD_TMP = 'uploads_tmp/'
const multer    = require('multer');
const upload    = multer({ dest: UPLOAD_TMP });

export const contractController = (router: Router) => {
  router.get('/v1/contracts/:contractId/user/:userId', async (req, res, next) => {
    try {
      const { contractId, userId }: any = req.params

      const found = await ContractService.getContractContextByUser(contractId, userId)
      
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })

  router.get('/v1/contracts/user/:userId', async (req, res, next) => {
    try {
      const {userId}: any = req.params
      const found         = await ContractService.getContracts(userId)
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })


  router.post('/v1/contracts', upload.single('contractFile'), async (req: any, res, next) => {      
    let pathsToDelete = []
    try {
      const {customerId, sellerId} = req.body

      const contractFile = req.file
      pathsToDelete.push(`${contractFile.path}`)
      await ContractService.createNewContract(customerId, sellerId, contractFile)
      
      jsonSuccess(res, {status: 'ok'} )
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

  router.get('/v1/contracts/:contractId/download-signature-proof', async (req, res, next) => {
    const { contractId } = req.params;
    const pdfStream: NodeJS.ReadableStream = await ContractService.downloadSignatureProof(contractId)
    pdfStream.pipe(res).on('end', () => res.status(200).send())
  });
}
