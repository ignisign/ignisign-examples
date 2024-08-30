import { Seal, SealModel } from "../../models/seal.db.model";
import { MyUserModel } from "../../models/user.db.model";
import { MulterFile } from "../../utils/controller.util";
import { streamToBuffer } from "../../utils/files.util";
import { IgnisignSdkManagerSealService } from "../ignisign/ignisign-sdk-manager-seal.service";
import { db, findCallback } from "./tinydb.utils";

const fs = require('fs');

export const SealService = {
  createM2MSeal,
  createSealSignatureRequest,
  getSeals,
  addTokenToSigner,
}

async function createM2MSeal(file : MulterFile, asPrivateFile: boolean) {
  console.log(1);
  
  const input = fs.createReadStream(file.path);
  console.log(2);

  const fileBuffer = await streamToBuffer(input);
  console.log(3);

  const {
    signatureRequestId,
    m2mId,
  } = await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileBuffer, asPrivateFile, file.mimetype);

  const body: Seal = {
    signatureRequestId,
    ignisignSignerId: m2mId,
    status: 'INIT',
    type: 'M2M',
  };
  await db.insert(SealModel, body);

}

// const findOne 
// await new Promise(async (resolve, reject) => {
//   ContractModel.findOne({_id: contractId, ignisignAppId, ignisignAppEnv}, findOneCallback(resolve, reject, true))
// });

async function createSealSignatureRequest(signerId: string, file, asPrivateFile: boolean) {
  try {
    const input = fs.createReadStream(file.path);
    const {
      signatureRequestId,
    } = await IgnisignSdkManagerSealService.createSealSignatureRequest(signerId, input, file.mimetype, asPrivateFile);
    const body: Seal = {
      signatureRequestId,
      ignisignSignerId: signerId,
      status: 'CREATED',
      type: 'MANUAL',
    };
    await db.insert(SealModel, body);
  } catch (error) {
    throw error;
  }
}

async function addTokenToSigner(signatureRequestId, signerId: string, token: string) {
  try {
    const findQuery = {signatureRequestId};
    const seal = await db.findOne<Seal>(SealModel, findQuery);
    const toUpdate = {
      ...seal,
      ignisignSignatureToken: token,
    }
    await db.updateOne(SealModel, findQuery, toUpdate);
  } catch (error) {
    throw error;
  }
}

async function getSeals() {
  const seals = await db.find<Seal>(SealModel, {});
  return seals ?? [];
}