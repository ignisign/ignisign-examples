import { IgnisignSignatureProfile, IgnisignWebhook } from '@ignisign/public';

import axios, { AxiosRequestConfig } from "axios";

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

  getSellers,
  addSeller,

  addCustomer,
  getCustomers,
}

/** DEMO APP CONTEXT */
async function getAppContext(): Promise<{requiredInputs, signatureProfile: IgnisignSignatureProfile, webhooks: IgnisignWebhook[]}> {
  return http.get(`/v1/app-context`)
}

/** PRIVATE FILE */
async function getPrivateFileUrl(documentHash){
  return http.get(`/v1/files/${documentHash}`)
}

/** CONTRACTS */

async function getContractContext(contractId, userId) {
  return http.get(`/v1/contracts/${contractId}/user/${userId}`)
}

async function getContracts(userId: string) {
  return http.get(`/v1/contracts/user/${userId}`)
}

async function createContract(selectedCustomerId, selectedSellerId, selectedFile) {
  const formData = new FormData();
  formData.append('customerId', selectedCustomerId);
  formData.append('sellerId', selectedSellerId);
  formData.append(`contractFile`, selectedFile.file);
  return http.post(`/v1/contracts`, formData, { headers: {'Content-Type': 'multipart/form-data'} })
}

/** CUSTOMERS */
async function getCustomers() {
  return http.get(`/v1/customers`)
}

async function addCustomer(body) {
  return http.post(`/v1/customers`, body)
}

/** SELLERS */
async function getSellers() {
  return http.get(`/v1/sellers`)
}

async function addSeller(body) {
  return http.post(`/v1/sellers`, body)
}