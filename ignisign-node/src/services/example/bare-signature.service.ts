import axios from 'axios';
import { BARE_SIGNATURE_STATUS, BareSignature, BareSignatureModel } from '../../models/bare-signature.db.model';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import { getFileHash, saveBufferAsFile, streamToBuffer } from '../../utils/files.util';
import { MulterFile } from '../../controllers/bare-signature.controller';
import { IgnisignInitializerService } from '../ignisign/ignisign-sdk-initializer.service';
import { IgnisignSdkUtilsService , Ignisign_BareSignature_SdkProofAccessTokenRequest } from '@ignisign/sdk';
import { IgnisignSdkManagerBareSignatureService } from '../ignisign/ignisign-sdk-manager-bare-signature.service';
import { findOneCallback, insertCallback } from './tinydb.utils';
import { Ignisign_BareSignature_ProofAccessToken } from '@ignisign/public';
import _ = require('lodash');
import { SignPdfService } from '../../utils/sign-utils';
import { PKCS7_Utils } from '../../utils/pkcs7.utils';
import { sign } from 'crypto';
import * as uuid from "uuid";


const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }

const EXAMPLE_FRONTEND_URL  = process.env.MY_FRONTEND_URL || 'http://localhost:3456';
const redirect_uri          = EXAMPLE_FRONTEND_URL+ '/bare-signature-callback';
                  
export const BareSignatureService = {
  createBareSignature,
  getBareSignatures,
  getAuthorizationUrl,
  saveAccessToken,
  getProofs,
}

async function getAuthorizationUrl(bareSignatureId: string) : Promise<string> {
  
  const bareSignature = await _getBareSignature(bareSignatureId);
  
  const codeChallenge = IgnisignSdkUtilsService.bareSiganture_GenerateCodeChallenge(bareSignature.codeVerifier);

  const { authorizationUrl } = await IgnisignSdkManagerBareSignatureService.getAuthorizationUrl({
    redirectUri   : redirect_uri,
    hashes        : [bareSignature.document.documentHash],
    externalId    : bareSignature._id,
    nonce         : nanoid(),
    codeChallenge : codeChallenge
  });

  _logIfDebug('getAuthorizationUrl_4 : ', { authorizationUrl });

  return authorizationUrl;
}


async function getProofToken(bareSignature : BareSignature) : Promise<string> {

  // _logIfDebug('getProofToken_1 : ', bareSignature);

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const dto : Ignisign_BareSignature_SdkProofAccessTokenRequest = {
    code_verifier   : bareSignature.codeVerifier,
    redirect_uri,
    code            : bareSignature.accessToken,
  };

  const response : Ignisign_BareSignature_ProofAccessToken = await IgnisignSdkManagerBareSignatureService.getBareSignatureProofToken(dto);

  return response.access_token;

}

async function getProofs(bareSignatureId: string, signPdfLocally = true) {


  const bareSignature = await _getBareSignature(bareSignatureId);
  const proofToken    = await getProofToken(bareSignature); 
  const proof         = await IgnisignSdkManagerBareSignatureService.getBareSignatureProofs(proofToken)

  _logIfDebug('getProofs : ', proof);

  // const contentPKCS7 = await PKCS7_Utils.getPKCS7contentFromBase64(proof?.proofs[0]?.proofB64);

  // console.log('contentPKCS7 : ', contentPKCS7);


  const signatureProof = proof?.proofs[0];
  if(!signatureProof){
    throw new Error('No proof found');
  }

  console.log('signatureProof : ', signatureProof);



  if(signPdfLocally){
    const signed = await SignPdfService.signFromBase64(bareSignature.document.fileB64, signatureProof.proofB64, signatureProof.signingTime);

    const uuidValue = uuid.v4();

    const name = bareSignature.title + "-signed-" + uuidValue + '.pdf';
    const path = await saveBufferAsFile(signed, 'uploads', name);
    console.log('path : ', path);
  }

  return proof;
}



/********************* REPOSITORY PART  ***************************/





async function createBareSignature(title: string, file: MulterFile) : Promise<BareSignature> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();
  const { path, mimetype, originalname } = file;

  const codeVerifier      = IgnisignSdkUtilsService.bareSignature_GenerateCodeVerifier();

  const input             = fs.createReadStream(file.path);
  const fileBuffer        = await streamToBuffer(input);
  const { signablePartBuffer,  fileWithPlaceholder }  = await SignPdfService.getSignablePartOfThePDF(fileBuffer);
  
  const fileHash      = await getFileHash(signablePartBuffer);  
  
  const fileB64       = fileWithPlaceholder.toString('base64'); // pdfWithoutPlaceholder.toString('base64'); // fileBufferSelected.toString('base64');

  console.log('fileHash from buffer Prepared: ', fileHash, fileHash.length);

  const fileHashFromStream = await getFileHash(fs.createReadStream(file.path));
  console.log('fileHash (original) FromStream : ', fileHashFromStream, fileHashFromStream.length);

  const fileHashBufferOriginal = await getFileHash(fileBuffer);
  console.log('fileHash (original) From Buffer : ', fileHashBufferOriginal, fileHashBufferOriginal.length);
  
  const uuidValue = uuid.v4();
  const namePrepared = title + "-prepared-" + uuidValue + '.pdf';
  const nameOriginal = title + "-original-" + uuidValue + '.pdf';
  await saveBufferAsFile(fileBuffer,             'uploads', nameOriginal);
  await saveBufferAsFile(fileWithPlaceholder,  'uploads', namePrepared);

  const bareSignatureToCreate : BareSignature = {
    title,
    document : { 
      fileB64,
      fileName     : originalname,
      mimeType     : mimetype,
      documentHash : fileHash 
    },
    ignisignAppId, 
    ignisignAppEnv,
    accessToken  : '',
    status       : BARE_SIGNATURE_STATUS.INIT,
    codeVerifier
  };

  const savedBareSignature = await new Promise<BareSignature>((resolve, reject) => {
    BareSignatureModel.insert(bareSignatureToCreate,  insertCallback(resolve, reject));
  });

  return savedBareSignature;
}

async function _updateBareSignature(bareSignatureId: string, update: Partial<BareSignature>) : Promise<BareSignature> {

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();
  
  return await new Promise<BareSignature>(async (resolve, reject) => { 
    return await BareSignatureModel.findOne({ _id: bareSignatureId, ignisignAppId, ignisignAppEnv }, async (error, bareSignature) => {
      if (error){ 
        reject(error);
        return;
      }

      if(!bareSignature){
        reject(new Error('Contract not found'))
        return;
      }
      
      const bareSignatureToUpdate = {
        ...bareSignature,
        ...update
      };

      await BareSignatureModel.update(
        {_id: bareSignatureId}, 
        bareSignatureToUpdate, 
        async (error, updated) => error ? reject(error) : resolve(bareSignatureToUpdate));
    });
  });
}

async function _getBareSignature(bareSignatureId: string) : Promise<BareSignature> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  return await new Promise<BareSignature>(async (resolve, reject) => {
    await BareSignatureModel.findOne({ _id: bareSignatureId, ignisignAppId, ignisignAppEnv }, findOneCallback(resolve, reject));
  });
}


async function getBareSignatures() : Promise<BareSignature[]> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const bareSignatures : BareSignature[] = await new Promise<BareSignature[]>(async (resolve, reject) => {

    await BareSignatureModel.find({ignisignAppId, ignisignAppEnv}).sort({ _id: -1 }).toArray((error, result) => {
      if(error) {
        console.error(error);
        reject(error);
        return;
      }

      resolve(result);
    });
  });

  // _logIfDebug('getBareSignatures : ', bareSignatures);
  return bareSignatures;
}



async function saveAccessToken(bareSignatureId: string, token: string) : Promise<void> {
  await _updateBareSignature(bareSignatureId, { 
    accessToken: token,
    status: BARE_SIGNATURE_STATUS.SIGNED
  });
}



