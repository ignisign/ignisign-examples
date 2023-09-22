import { Router } from "express";
import { ContractService } from "../services/contract.service";
import { jsonError, jsonSuccess } from "../utils/controller.util";
import { deleteFile } from "../utils/files.util";

const UPLOAD_TMP = 'uploads_tmp/'
const multer    = require('multer');
const upload    = multer({ dest: UPLOAD_TMP });

export const contractController = (router: Router) => {
  router.get('/v1/contracts/:contractId/user/:userId', async (req, res, next) => {
    try {
      const {contractId, userId}: any = req.params
      const found = await ContractService.getContractContextByUser(contractId, userId)
      console.log(found);
      
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })

  router.get('/v1/contracts/user/:userId', async (req, res, next) => {
    try {
      const {userId}: any = req.params
      const found = await ContractService.getContracts(userId)
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
}