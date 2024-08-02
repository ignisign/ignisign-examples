import axios from 'axios';
import { BARE_SIGNATURE_STATUS, BareSignature, BareSignatureModel, IgnisignOAuth2_ProofAccessToken, IgnisignOAuth2_ProofAccessTokenRequest } from '../models/bare-signature.db.model';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import { getFileHash } from '../utils/files.util';
import { MulterFile } from '../controllers/bare-signature.controller';
const crypto = require('crypto');

const { 
  IGNISIGN_SERVER_URL, 
  IGNISIGN_BARE_SIGNATURE_APP_ID      : appId, 
  IGNISIGN_BARE_SIGNATURE_APP_SECRET  : appSecret, 
  IGNISIGN_BARE_SIGNATURE_APP_ENV     : appEnv
} = process.env;

const redirect_uri = 'http://localhost:3456/bare-signature-callback';

const serverUrl = `${IGNISIGN_SERVER_URL}/v4`
const baseUrl = `${serverUrl}/envs/${appEnv}/oauth2`;   
                  
export const BareSignatureService = {
  createBareSignature,
  getBareSignatures,
  getAuthorizationUrl,
  saveAccessToken,
  generateCodeVerifier,
  generateCodeChallenge,
  getProof,
}

function generateCodeVerifier(length = 128) {
  const codeVerifier = crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return codeVerifier;
}

function generateCodeChallenge(codeVerifier) {
  return crypto.createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function getAuthorizationUrl(bareSignatureId: string) : Promise<string> {
  const bareSignature = await _getBareSignature(bareSignatureId);

  const state = {
    hashes          : [bareSignature.document.documentHash],
    nonce           : nanoid(),
    bareSignatureId : bareSignature._id
  };

  const codeChallenge = generateCodeChallenge(bareSignature.codeVerifier);

  const params = {
    redirect_uri,
    response_type          : 'code',
    client_id              : appId,
    state                  : JSON.stringify(state),
    code_challenge         : codeChallenge,
    code_challenge_method  : 'S256'
  };

  const authorizationUrl = `${baseUrl}/authorize?${Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}`;
  return authorizationUrl;  
}

async function createBareSignature(title: string, file: MulterFile) : Promise<BareSignature> {
  const { path, mimetype, originalname } = file;

  const fileHash      = await getFileHash(fs.createReadStream(path));
  const fileB64       = fs.readFileSync(path).toString('base64');
  const codeVerifier  = BareSignatureService.generateCodeVerifier();


  const bareSignatureToCreate : BareSignature = {
    title,
    document : { 
      fileB64,
      fileName     : originalname,
      mimeType     : mimetype,
      documentHash : fileHash 
    },
    accessToken  : '',
    status       : BARE_SIGNATURE_STATUS.INIT,
    codeVerifier
  };

  const savedBareSignature = await new Promise<BareSignature>((resolve, reject) => {
    BareSignatureModel.insert(bareSignatureToCreate,  async (error, inserted) => {
      if(error) {
        console.error(error);
        reject(error);
        return;
      }

      if(!inserted || !inserted.length) {
        reject(new Error("BareSignature not inserted"));
        return;
      }

      resolve(inserted[0]);
    });
  });


  return savedBareSignature;
}


async function getBareSignatures() : Promise<BareSignature[]> {
  const bareSignatures : BareSignature[] = await new Promise<BareSignature[]>(async (resolve, reject) => {
    await BareSignatureModel.find({}).sort({ _id: -1 }).toArray((error, result) => {
      if(error) {
        console.error(error);
        reject(error);
        return;
      }


      resolve(result);
    });
  });

  console.log('getBareSignatures : ', bareSignatures);
  return bareSignatures;
}

async function saveAccessToken(bareSignatureId: string, token: string) : Promise<void> {
  await _updateBareSignature(bareSignatureId, { 
    accessToken: token,
    status: BARE_SIGNATURE_STATUS.SIGNED
  });
}

async function getProof(bareSignatureId: string) {
  console.log('getProof_0 : ', bareSignatureId);

  const bareSignature = await _getBareSignature(bareSignatureId);

  console.log('getProof_1 : ', bareSignature);

  const proofToken = await getProofToken(bareSignature);
  console.log('getProof_2 : ', proofToken);

  const proof = (await axios.get(`${baseUrl}/sign-oauth2-proof`, {
    headers: {
      Authorization: `Bearer ${proofToken}`
    }
  }))?.data;

  console.log('getProof_3 : ', proof);
  return proof;
}

async function getProofToken(bareSignature : BareSignature) : Promise<string> {
  console.log('getProofToken_1 : ', bareSignature);

  const dto : IgnisignOAuth2_ProofAccessTokenRequest = {
    client_id       : appId,
    client_secret   : appSecret,
    code_verifier   : bareSignature.codeVerifier,
    redirect_uri,
    grant_type      : 'authorization_code',
    code            : bareSignature.accessToken
  };

  console.log('getProofToken_2 : ', dto);

  const response : IgnisignOAuth2_ProofAccessToken = (
    await axios.post(
      `${baseUrl}/sign-oauth2-proof-token`, 
      dto,
      { headers: { 'Referer': 'http://localhost:3456' } })
    )?.data;
  
  return response.access_token;
}

async function _updateBareSignature(bareSignatureId: string, update: Partial<BareSignature>) : Promise<BareSignature> {
  return await new Promise<BareSignature>(async (resolve, reject) => { 
    return await BareSignatureModel.findOne({ _id: bareSignatureId }, async (error, bareSignature) => {
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
  return await new Promise<BareSignature>(async (resolve, reject) => {
    await BareSignatureModel.findOne({ _id: bareSignatureId }, async (error, result) => {
      if(error) {
        console.error(error);
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}
