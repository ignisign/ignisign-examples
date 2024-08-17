import { IgnisignWebhook, IgnisignWebhook_ActionDto } from "@ignisign/public";
import { IgnisignSdk } from "@ignisign/sdk";

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}

export const IgnisignSdkManagerCommonsService = {
  checkWebhookEndpoint,
  getWebhookEndpoints,
  consumeWebhook,
}



// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint(ignisignSdkInstance : IgnisignSdk) : Promise<void>{
  
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();
    if(webhookEndpoints.length === 0)
      console.warn("WARN: No webhook endpoints found, please create one in the Ignisign Console - In dev mode, you can use ngrok to expose your localhost to the internet")

  } catch(e) {
    console.error("IgnisignSdkManagerSignatureService: Error when checking webhook endpoint", e)
    throw e
  }
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints(ignisignSdkInstance : IgnisignSdk, ) : Promise<IgnisignWebhook[]>{
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();

    _logIfDebug("getWebhookEndpoints", webhookEndpoints)

    return webhookEndpoints;
  } catch(e) {
    console.error("IgnisignSdkManagerSignatureService: Error when checking webhook endpoint", e)
    throw e
  } 
}


// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(ignisignSdkInstance : IgnisignSdk, actionDto: IgnisignWebhook_ActionDto) {
  _logIfDebug("consumeWebhook", actionDto)
  return await ignisignSdkInstance.consumeWebhook(actionDto);
}

