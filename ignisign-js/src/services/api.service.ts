import { IgnisignDocument_PrivateFileDto, IgnisignLogCapsule_ResponseDto, IgnisignSignatureProfile, IgnisignSignatureRequest_WithDocName, IgnisignWebhook } from '@ignisign/public';

import axios, { AxiosRequestConfig } from "axios";
import { Contract, ContractContext } from '../models/contract.front-model';
import { ExampleFront_Full_AppContextType } from '../models/global.front-model';
import { MyUser } from '../models/user.front.model';
import { BareSignature, RedirectUrlWrapper } from '../models/bare-signature.front-model';

const APP_BACKEND_ENDPOINT = process?.env?.REACT_APP_BACKEND_ENDPOINT || "http://localhost:4242"

const getUrl = (url) => `${APP_BACKEND_ENDPOINT}${url}`

const http = {
  post    : async (url, body, options: AxiosRequestConfig = {}) => (await axios.post(getUrl(url), body, options))?.data,
  get     : async (url, options: AxiosRequestConfig = {})       => (await axios.get(getUrl(url), options))?.data,
  delete  : async (url, options: AxiosRequestConfig = {})       => (await axios.delete(getUrl(url), options))?.data
}

export const ApiService = {
  getAppContext,

  getPrivateFileUrl,

  createContract,
  getContracts,
  getContractContext,
  downloadSignatureProof,

  getEmployees,
  addEmployee,

  addCustomer,
  getCustomers,

  getBareSignatures,
  bareSignatureUploadFile,
  bareSignatureLogin,
  bareSignatureSaveAccessToken,
  bareSignatureGetProof,
  getAuthorizationUrl,

  checkSealSetup,
  createSealSignatureRequest,
  doM2MSeal,

  createLogCapsule,
  getSeals,
  getNewSignerAuthSecret,
}

async function getNewSignerAuthSecret(ignisignSignerId): Promise<string> {
  return http.get(`/v1/seals/${ignisignSignerId}/new-auth-secret`)
}

async function getSeals(): Promise<IgnisignSignatureRequest_WithDocName[]> {
  return http.get(`/v1/seals`)
}

/** SEALS */
async function createSealSignatureRequest(signerId: string, selectedFile, asPrivateFile: boolean): Promise<IgnisignSignatureProfile> {
  const formData = new FormData();
  formData.append(`file`, selectedFile.file);
  formData.append('asPrivateFile', asPrivateFile.toString());
  return http.post(`/v1/seal-creation/${signerId}`, formData, { headers: {'Content-Type': 'multipart/form-data'}})
}

async function doM2MSeal(selectedFile, asPrivateFile : boolean): Promise<any> {
  const formData = new FormData();
  formData.append(`file`, selectedFile.file);
  formData.append('asPrivateFile', asPrivateFile.toString());

  return http.post(`/v1/seal-m2m-sign`, formData, { headers: {'Content-Type': 'multipart/form-data'}, responseType: 'blob' })
}


async function checkSealSetup(): Promise<{isEnabled: boolean}> {
  return http.get(`/v1/seal/get-app-m2m-status`)
}

/** Log Capsule */

async function createLogCapsule(): Promise<IgnisignLogCapsule_ResponseDto> {
  return http.post(`/v1/log-capsule`, {})
}




/** DEMO APP CONTEXT */
async function getAppContext(): Promise<ExampleFront_Full_AppContextType> {
  return http.get(`/v1/app-context`)
}

/** PRIVATE FILE */
async function getPrivateFileUrl(documentHash: string): Promise<IgnisignDocument_PrivateFileDto>{
  return http.get(`/v1/files/${documentHash}/private-file-info`)
}

/** CONTRACTS */

async function getContractContext(contractId: string, userId: string): Promise<ContractContext> {
  return http.get(`/v1/contracts/${contractId}/user/${userId}`)
}

async function getContracts(userId: string): Promise<Contract> {
  return http.get(`/v1/user/${userId}/contracts`)
}

async function downloadSignatureProof(contractId: string) {
  return http.get(`/v1/contracts/${contractId}/download-signature-proof`, {responseType: 'blob'})
}

async function createContract(selectedCustomerId: string, selectedEmployeeId: string, selectedFile): Promise<any> {
  const formData = new FormData();
  formData.append('customerId', selectedCustomerId);
  formData.append('employeeId', selectedEmployeeId);
  formData.append(`contractFile`, selectedFile.file);
  return http.post(`/v1/contracts`, formData, { headers: {'Content-Type': 'multipart/form-data'} })
}

/** CUSTOMERS */
async function getCustomers(): Promise<MyUser[]> {
  return http.get(`/v1/customers`)
}

async function addCustomer(body): Promise<MyUser> {
  return http.post(`/v1/customers`, body)
}

/** SELLERS */
async function getEmployees(): Promise<MyUser[]> {
  return http.get(`/v1/employees`)
}

async function addEmployee(body): Promise<MyUser> {
  return http.post(`/v1/employees`, body)
}

/** BARE SIGNATURE */

async function bareSignatureUploadFile(title: string, file: File): Promise<BareSignature> {
  console.log('bareSignatureUploadFile : ', file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  return http.post(`/v1/bare-signatures/upload-file`, formData, { headers: {'Content-Type': 'multipart/form-data'} })
}

async function bareSignatureLogin(bareSignatureId: string): Promise<RedirectUrlWrapper> {
  return http.get(`/v1/bare-signatures/${bareSignatureId}/login`)
}

async function bareSignatureSaveAccessToken(bareSignatureId: string, token: string) {
  return http.post(`/v1/bare-signatures/${bareSignatureId}/save-access-token`, { token });
}

async function bareSignatureGetProof(bareSignatureId: string) {
  return http.get(`/v1/bare-signatures/${bareSignatureId}/proof`);
}

async function getBareSignatures(): Promise<BareSignature[]> {
  return http.get(`/v1/bare-signatures`)
}

async function getAuthorizationUrl(bareSignatureId: string): Promise<string> {
  return http.get(`/v1/bare-signatures/${bareSignatureId}/authorize`);
}
