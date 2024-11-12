import { Seal, SealModel } from "../../models/seal.db.model";
import { MyUserModel } from "../../models/user.db.model";
import { MulterFile } from "../../utils/controller.util";
import { streamToBuffer } from "../../utils/files.util";
import { IgnisignSdkManagerSealService } from "../ignisign/ignisign-sdk-manager-seal.service";
import { db, findCallback } from "./tinydb.utils";
import { Readable } from 'stream';


const fs = require('fs');

export const SealService = {
  createM2MSeal,
  createSealSignatureRequest,
  getSeals,
  addTokenToSigner,
  sealIsComplete
}

async function sealIsComplete(signatureRequestId){
  try {
    const findQuery = {signatureRequestId};
    const seal = await db.findOne<Seal>(SealModel, findQuery);
    const toUpdate: Seal = {
      ...seal,
      status: 'DONE',
    }
    await db.updateOne(SealModel, findQuery, toUpdate);
  } catch (error) {
    throw error;
  }
}

async function createM2MSeal(file : MulterFile, inputType: string) : Promise<Buffer> {
  const input = fs.createReadStream(file.path);
  const fileBuffer = await streamToBuffer(input);

  const {
    signatureRequestId,
    proofBase64,
    m2mId,
  } = await IgnisignSdkManagerSealService.createM2mSignatureRequest(fileBuffer, inputType, file.mimetype);

  const body: Seal = {
    signatureRequestId,
    ignisignSignerId: m2mId,
    status: 'INIT',
    type: 'M2M',
  };
  await db.insert(SealModel, body);

  // console.log("proofBase64", proofBase64)

  
  const proofBuffer = Buffer.from(proofBase64, 'base64');
  

 
  return proofBuffer;

}

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
    const toUpdate: Seal = {
      ...seal,
      status: 'INIT',
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