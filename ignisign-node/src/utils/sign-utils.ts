import { PDFDocument } from 'pdf-lib';
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import signpdf from '@signpdf/signpdf';
import { Signer} from '@signpdf/utils';
import * as uuid from "uuid";
import { saveBufferAsFile } from './files.util';

import { SUBFILTER_ETSI_CADES_DETACHED } from '@signpdf/utils';



const  PDF_SEAL_CONTACT_INFO = "example contact info";
const  PDF_SEAL_LOCATION = "luxembourg";
const  PDF_SEAL_NAME = "example name";
const  PDF_SEAL_REASON = "sealed by ignisign";

export const SignPdfService = {
  sealPDF,
  signFromBase64,
  prepareToSign,
};


async function prepareToSign(
  file: Buffer,
  
): Promise<Buffer> {

  const pdf    = await PDFDocument.load(file);

  const currentDate = new Date();

  // Ajouter 15 minutes
  currentDate.setMinutes(currentDate.getMinutes() + 15);

  pdflibAddPlaceholder({
    pdfDoc      : pdf,
    reason      : PDF_SEAL_REASON,
    contactInfo : PDF_SEAL_CONTACT_INFO,
    name        : PDF_SEAL_NAME,
    location    : PDF_SEAL_LOCATION,
    // signingTime : currentDate
   // subFilter: SUBFILTER_ETSI_CADES_DETACHED,
  });

  const fileWithPlaceholder = await pdf.save();

  return Buffer.from(fileWithPlaceholder);

}


async function signFromBase64(
  file: string,
  pkcs7File: string,
  signingTime: Date
): Promise<Buffer> {
  const fileBuffer    = Buffer.from(file, 'base64');
  const pkcs7Buffer   = Buffer.from(pkcs7File, 'base64');

  // const pkcs7BufferLength = pkcs7Buffer.length;
  // console.log('pkcs7BufferLength : ', pkcs7BufferLength);

  // const arrayBuffer = pkcs7Buffer.buffer.slice(pkcs7Buffer.byteOffset, pkcs7Buffer.byteOffset + pkcs7BufferLength);
  // const arrayBufferLength = arrayBuffer.byteLength;
  // console.log('arrayBufferLength : ', arrayBufferLength);

  const sealed        = await sealPDF(fileBuffer, pkcs7Buffer, signingTime);

  return sealed;

}


export class PKCS7Signer extends Signer {

    constructor(private pkcs7DerBuffer: Buffer) {
        super();
    }

    async sign(pdfBuffer, signingTime = undefined) {
        return this.pkcs7DerBuffer; //Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
    }
}


async function sealPDF(
  file: Buffer,
  pkcs7File: Buffer,
  signingTime: Date

): Promise<Buffer> {
  
  const signer = new PKCS7Signer(pkcs7File);
  const pdf    = await PDFDocument.load(file);


  // const signed = await signpdf.sign(file, signer, signingTime);

  pdflibAddPlaceholder({
    pdfDoc      : pdf,
    reason      : PDF_SEAL_REASON,
    contactInfo : PDF_SEAL_CONTACT_INFO,
    name        : PDF_SEAL_NAME,
    location    : PDF_SEAL_LOCATION,
    signingTime : new Date(signingTime)
  });

  const fileWithPlaceholder = await pdf.save();
  const signed = await signpdf.sign(fileWithPlaceholder, signer, signingTime);
  
  return Buffer.from(signed);
}
