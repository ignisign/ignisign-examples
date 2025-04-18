import { cleanEnv, port, str, url } from 'envalid';

const envDef: any = {
  API_NAME        : str(),
  PORT            : str(),
  MY_SERVER_URL   : url(),

  IGNISIGN_APP_ID       : str(),
  IGNISIGN_APP_ENV      : str(),
  IGNISIGN_API_KEY   : str(),

  // IGNISIGN_SIGNATURE_PROFILE_ID: str(),
}

function validateEnv() {
  return cleanEnv(process.env, envDef)
}

export default validateEnv;