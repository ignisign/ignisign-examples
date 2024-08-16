import { MulterFile } from "../../utils/controller.util";
import { IgnisignSdkManagerSealService } from "../ignisign/ignisign-sdk-manager-seal.service";

const fs = require('fs');

export const SealService = {
  createM2MSeal,
}

function streamToBuffer(stream)  : Promise<Buffer> {
  return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk) );
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
  });
}


async function createM2MSeal(file : MulterFile, asPrivateFile: boolean) {

  const input = fs.createReadStream(file.path);
  const fileBuffer = await streamToBuffer(input);

  const result = await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileBuffer, asPrivateFile, file.mimetype);


}