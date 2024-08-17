import * as path from 'path';

// @ts-ignore
global['appRoot'] = path.join(__dirname, '..');

import * as express from 'express';
import cookieParser = require('cookie-parser');
import cors = require('cors');

import validateEnv from './utils/validate-env';
  
import 'dotenv/config'; 
import { IgnisignSdkManagerSignatureService } from './services/ignisign/ignisign-sdk-manager-signature.service';


import { errorMiddleware } from './utils/error.middleware';
import { checkBearerToken } from './utils/authorization.middleware';
import { jsonError, jsonSuccess } from './utils/controller.util';
import { CustomerController } from './controllers/customer.controller';
import { EmployeeController } from './controllers/employee.controller';
import { ContractController } from './controllers/contract.controller';
import { AppController } from './controllers/app.controller';
import { SealController } from './controllers/seal.controller';
import { BareSignatureController } from './controllers/bare-signature.controller';
import { IgnisignSdkManagerSealService } from './services/ignisign/ignisign-sdk-manager-seal.service';
import { IgnisignInitializerService } from './services/ignisign/ignisign-sdk-initializer.service';
import { LogCapsuleController } from './controllers/log-capsule.controller';

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
    

    await IgnisignInitializerService.initSdks();

    router.get('/v1/healthcheck', (req, res) => jsonSuccess(res, {status: 'ok'} ));

    await AppController(router)
    await ContractController(router);
    await CustomerController(router);
    await EmployeeController(router);
    await SealController(router);
    await BareSignatureController(router);
    await LogCapsuleController(router);
    

    app.use(router);
    app.use(errorMiddleware);
    app.listen(port, () => console.info(`🚀 App listening on the port ${port}`));

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

initExampleApp();