import { MulterFile } from "../../utils/controller.util";
import { streamToBuffer } from "../../utils/files.util";
import { IgnisignSdkManagerSealService } from "../ignisign/ignisign-sdk-manager-seal.service";

const fs = require('fs');

export const SealService = {
  createM2MSeal,
  createSealSignatureRequest,
  getSeals,
}



async function createM2MSeal(file : MulterFile, asPrivateFile: boolean) {
  console.log(1);
  
  const input = fs.createReadStream(file.path);
  console.log(2);

  const fileBuffer = await streamToBuffer(input);
  console.log(3);

  const result = await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileBuffer, asPrivateFile, file.mimetype);


}

async function createSealSignatureRequest(signerId, file) {
  const input = fs.createReadStream(file.path);
  await IgnisignSdkManagerSealService.createSealSignatureRequest(signerId, input, file.mimetype);
}

async function getSeals() {
  return IgnisignSdkManagerSealService.getSeals();
}