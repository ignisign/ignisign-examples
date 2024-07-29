import * as path from 'path';

// @ts-ignore
global['appRoot'] = path.join(__dirname, '..');

import * as express from 'express';
import cookieParser = require('cookie-parser');
import cors = require('cors');

import validateEnv from './utils/validate-env';
  
import 'dotenv/config'; 
import { IgnisignSdkManagerService, IgnisignSealSdkManagerService } from './services/ignisign-sdk-manager.service';

import { errorMiddleware } from './utils/error.middleware';
import { checkBearerToken } from './utils/authorization.middleware';
import { jsonError, jsonSuccess } from './utils/controller.util';
import { customerController } from './controllers/customer.controller';
import { employeeController } from './controllers/employee.controller';
import { contractController } from './controllers/contract.controller';
import { appController } from './controllers/app.controller';
import { sealController } from './controllers/seal.controller';
import { bareSignatureController } from './controllers/bare-signature.controller';

validateEnv()

const port      = process.env.PORT || 4242;

const initExampleApp = async () =>{
  try {

    console.log("IGNISIGN_APP_ID", process.env.IGNISIGN_APP_ID);
    console.log("IGNISIGN_APP_ENV", process.env.IGNISIGN_APP_ENV);

    const app     : express.Application = express();
    const router  : express.Router      = express.Router();

    app.use(express.json({limit: "15mb"}));
    app.use(express.urlencoded({ extended: true , limit: "15mb"}));
    app.use(cookieParser());
    app.use(cors({ origin: true, credentials: true }));
    app.use('/uploads', checkBearerToken, express.static('uploads'));
    
    await IgnisignSdkManagerService.init();
    await IgnisignSealSdkManagerService.init();

    router.get('/v1/healthcheck', (req, res) => jsonSuccess(res, {status: 'ok'} ));

    await appController(router)
    await contractController(router);
    await customerController(router);
    await employeeController(router);
    await sealController(router);
    await bareSignatureController(router);

    app.use(router);
    app.use(errorMiddleware);
    app.listen(port, () => console.info(`🚀 App listening on the port ${port}`));

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

initExampleApp();