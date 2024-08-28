import { MulterFile } from "../../utils/controller.util";
import { streamToBuffer } from "../../utils/files.util";
import { IgnisignSdkManagerSealService } from "../ignisign/ignisign-sdk-manager-seal.service";

const fs = require('fs');

export const SealService = {
  createM2MSeal,
}



async function createM2MSeal(file : MulterFile, asPrivateFile: boolean) {

  const input = fs.createReadStream(file.path);
  const fileBuffer = await streamToBuffer(input);

  const result = await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileBuffer, asPrivateFile, file.mimetype);


}