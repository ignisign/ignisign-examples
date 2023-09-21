import * as path from 'path';

// @ts-ignore
global['appRoot'] = path.join(__dirname, '..');


import * as express from 'express';
import cookieParser = require('cookie-parser');
import cors = require('cors');

import validateEnv from './utils/validate-env';

import { NextFunction, Request, Response } from 'express';
  
import 'dotenv/config'; 
import { IgnisignSdkManagerService } from './services/ignisign-sdk-manager.service';
import { deleteFile } from './utils/files.util';
import { FileService } from './services/files.service';
import { errorMiddleware } from './utils/error.middleware';
import { checkBearerToken } from './utils/authorization.middleware';
import { jsonError, jsonSuccess } from './utils/controller.util';
import { customerController } from './controllers/customer.controller';
import { sellerController } from './controllers/seller.controller';
import { IGNISIGN_INTEGRATION_MODE } from '@ignisign/public';
import { contractController } from './controllers/contract.controller';

validateEnv()

const port      = process.env.PORT || 4242;

const initExampleApp = async () =>{
  try {

    const app     : express.Application = express();
    const router  : express.Router      = express.Router();

    app.use(express.json({limit: "15mb"}));
    app.use(express.urlencoded({ extended: true , limit: "15mb"}));
    app.use(cookieParser());
    app.use(cors({ origin: true, credentials: true }));
    app.use('/uploads', checkBearerToken, express.static('uploads'));
    

    await IgnisignSdkManagerService.init();

    router.get('/v1/healthcheck', (req, res) => jsonSuccess(res, {status: 'ok'} ));

    router.get('/v1/files/:fileHash', async (req: Request, res: Response, next: NextFunction) => {
      try {        
        const {fileHash} = req.params
        const found = await FileService.getPrivateFileUrl(fileHash)
        return jsonSuccess(res, found)
      } catch(e) { next(e) }
    })

    router.get('/v1/app-context', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID
        const inputs = await IgnisignSdkManagerService.getSignatureProfileSignerInputsConstraints(signatureProfileId);
        const signatureProfile = await IgnisignSdkManagerService.getSignatureProfile(signatureProfileId);
        return jsonSuccess(res, {
          requiredInputs: inputs,
          signatureProfile,
          webhooks: await IgnisignSdkManagerService.getWebhookEndpoints()
        });
      } catch(e) { next(e) }
    })

    router.post('/v1/ignisign-webhook', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await IgnisignSdkManagerService.consumeWebhook(req.body);
        jsonSuccess(res, result);
      } catch(e) { next(e) }
    })

    await contractController(router);
    await customerController(router);
    await sellerController(router);

    app.use(router);
    app.use(errorMiddleware);
    app.listen(port, () => console.info(`🚀 App listening on the port ${port}`));

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

initExampleApp();