import { IgnisignSdkManagerLogCapsuleService } from "../ignisign/ignisign-sdk-manager-logs-capsule.service";
const crypto = require('crypto');

export const LogCapsuleService = {
  logCapsuleCreate
}

function generateRandomString(length) {
  return crypto.randomBytes(length)
               .toString('base64')
               .slice(0, length)
               .replace(/\+/g, '0')  // Replace '+' with '0' (optional)
               .replace(/\//g, '0');  // Replace '/' with '0' (optional)
}

function sha256Base64(input) {
  return crypto.createHash('sha256')  // Create a SHA-256 hash instance
               .update(input)         // Update the hash with the input string
               .digest('base64');      // Digest the hash and encode it in base64
}

async function logCapsuleCreate() {

  const randomData = generateRandomString(42);
  const hash = sha256Base64(randomData);
  

  const result = await IgnisignSdkManagerLogCapsuleService.logCapsuleCreate(hash);

  console.log('logCapsuleCreate result:', result);

  return result;

 

}