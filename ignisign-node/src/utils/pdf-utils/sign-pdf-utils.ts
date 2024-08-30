import _ = require('lodash');

import { getFileHash, saveBufferAsFile } from '../files.util';
import { PdfPlaceholderUtisService } from './pdf-placeholder.utils';
import { PDF_UTILS_ERROR_TYPE, PdfUtilsError } from "./pdf-utils.const";

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }

export const SignPdfService = {
  sealPDF,
  signFromBase64,
  getSignablePartOfThePDF,
};


async function getSignablePartOfThePDF(
  file: Buffer,
  
): Promise<{
  signablePartBuffer: Buffer,
  fileWithPlaceholder : Buffer,
}> {

  const bufferWithPlaceHolder = await PdfPlaceholderUtisService.addPlaceholder(file);

  const { pdfWithoutPlaceholder, fileWithPlaceholder } = await PdfPlaceholderUtisService.removePlaceHolder(bufferWithPlaceHolder, true);

  return {
    signablePartBuffer: pdfWithoutPlaceholder,
    fileWithPlaceholder : Buffer.from(fileWithPlaceholder),
  };
}


async function signFromBase64(
  file: string,
  pkcs7File: string,
  signingTime: Date
): Promise<Buffer> {

  const fileBuffer    = Buffer.from(file, 'base64');
  const pkcs7Buffer   = Buffer.from(pkcs7File, 'base64');
  const sealed        = await sealPDF(fileBuffer, pkcs7Buffer, signingTime);

  return sealed;
}

async function sealPDF(
  file: Buffer,
  pkcs7File: Buffer,
  signingTime: Date

): Promise<Buffer> {
  
  let { pdfWithoutPlaceholder, placeholderLength, byteRange } = await PdfPlaceholderUtisService.removePlaceHolder(file, false);

  const fileHash      = await getFileHash(pdfWithoutPlaceholder); 

  _logIfDebug('sealPDF: fileHash from buffer Prepared: ', fileHash, fileHash.length);

  const raw = pkcs7File;

  // Check if the PDF has a good enough placeholder to fit the signature.
  // placeholderLength represents the length of the HEXified symbols but we're
  // checking the actual lengths.
  if ((raw.length * 2) > placeholderLength)
      throw new PdfUtilsError( `Signature exceeds placeholder length: ${raw.length * 2} > ${placeholderLength}`, PDF_UTILS_ERROR_TYPE.TYPE_INPUT);

  let signature = raw.toString('hex');

  _logIfDebug('signature : ', signature);
  _logIfDebug('signature length : ', signature.length);
  _logIfDebug('signature length (raw) : ', raw.length);

  // Store the HEXified signature. At least useful in tests.
  // this.lastSignature = signature;

  // Pad the signature with zeroes so the it is the same length as the placeholder
  signature += Buffer
      .from(String.fromCharCode(0).repeat((placeholderLength / 2) - raw.length))
      .toString('hex');

  // Place it in the document.
  pdfWithoutPlaceholder = Buffer.concat([
    pdfWithoutPlaceholder.slice(0, byteRange[1]),
      Buffer.from(`<${signature}>`),
      pdfWithoutPlaceholder.slice(byteRange[1]),
  ]);

  return Buffer.from(pdfWithoutPlaceholder);
}
