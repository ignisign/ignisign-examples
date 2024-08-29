import { PDFDocument } from 'pdf-lib';
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import signpdf from '@signpdf/signpdf';
import { Signer, convertBuffer,
  DEFAULT_BYTE_RANGE_PLACEHOLDER,
  removeTrailingNewLine,
  //findByteRange,
  SignPdfError,} from '@signpdf/utils';
import * as uuid from "uuid";
import { getFileHash, saveBufferAsFile } from './files.util';

import { SUBFILTER_ETSI_CADES_DETACHED } from '@signpdf/utils';
import _ = require('lodash');

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }

const  PDF_SEAL_CONTACT_INFO = "example contact info";
const  PDF_SEAL_LOCATION = "luxembourg";
const  PDF_SEAL_NAME = "example name";
const  PDF_SEAL_REASON = "sealed by ignisign";

export const SignPdfService = {
  sealPDF,
  signFromBase64,
  getSignablePartOfThePDF,
};



const findByteRange = (pdf, chechWithDefaultPlaceholder=true) => {

  const placeholder = DEFAULT_BYTE_RANGE_PLACEHOLDER;
  if (!(pdf instanceof Buffer)) {
      throw new SignPdfError(
          'PDF expected as Buffer.',
          SignPdfError.TYPE_INPUT,
      );
  }

  let byteRangePlaceholder;
  let byteRangePlaceholderPosition;
  const byteRangeStrings = [];
  const byteRanges = [];
  let offset = 0;
  do {
      const position = pdf.indexOf('/ByteRange', offset);
      if (position === -1) {
          break;
      }

      const rangeStart = pdf.indexOf('[', position);
      const rangeEnd = pdf.indexOf(']', rangeStart);

      const byteRangeString = pdf.subarray(position, rangeEnd + 1);
      byteRangeStrings.push(byteRangeString.toString());

      const range = pdf.subarray(rangeStart + 1, rangeEnd)
          .toString()
          .split(' ')
          .filter((c) => c !== '')
          .map((c) => c.trim());

      byteRanges.push(range);
      if(chechWithDefaultPlaceholder) {
        const placeholderName = `/${placeholder}`;
        if (range[0] === '0' && range[1] === placeholderName && range[2] === placeholderName && range[3] === placeholderName) {
            if (typeof byteRangePlaceholder !== 'undefined') {
                throw new SignPdfError(
                    'Found multiple ByteRange placeholders.',
                    SignPdfError.TYPE_INPUT,
                );
            }
            byteRangePlaceholder = byteRangeString.toString();
            byteRangePlaceholderPosition = position;
        }

        offset = rangeEnd;

    } else {
      byteRangePlaceholder = byteRangeString.toString();
      byteRangePlaceholderPosition = position;
      offset = rangeEnd;
    }

      // eslint-disable-next-line no-constant-condition
  } while (true);

  return {
      byteRangePlaceholder,
      byteRangePlaceholderPosition,
      byteRangeStrings,
      byteRanges,
  };
};


async function _removePlaceHolder(bufferWithPlaceHolder: Buffer, doByteRange = true)
 : Promise<{
    pdfWithoutPlaceholder: Buffer,
    byteRange: number[],
    placeholderLength: number,
    fileWithPlaceholder : Buffer,

  }> {


  let pdfWithoutPlaceholder = removeTrailingNewLine(bufferWithPlaceHolder);

  // Find the ByteRange placeholder.
  const {byteRangePlaceholder, byteRangePlaceholderPosition} = findByteRange(pdfWithoutPlaceholder, doByteRange);

  if (!byteRangePlaceholder && doByteRange)
      throw new SignPdfError('No ByteRangeStrings found within PDF buffer.', SignPdfError.TYPE_PARSE,);

  _logIfDebug('byteRangePlaceholder : ', byteRangePlaceholder);
  _logIfDebug('byteRangePlaceholderPosition : ', byteRangePlaceholderPosition);
  

  // Calculate the actual ByteRange that needs to replace the placeholder.
  const byteRangeEnd    = byteRangePlaceholderPosition + byteRangePlaceholder.length;
  const contentsTagPos  = pdfWithoutPlaceholder.indexOf('/Contents ', byteRangeEnd);
  const placeholderPos  = pdfWithoutPlaceholder.indexOf('<', contentsTagPos);
  const placeholderEnd  = pdfWithoutPlaceholder.indexOf('>', placeholderPos);

  const placeholderLengthWithBrackets = (placeholderEnd + 1) - placeholderPos;
  const placeholderLength             = placeholderLengthWithBrackets - 2;
  const byteRange = [0, 0, 0, 0];

  _logIfDebug('byteRangeEnd : ', byteRangeEnd);
  _logIfDebug('contentsTagPos : ', contentsTagPos);
  _logIfDebug('placeholderPos : ', placeholderPos);
  _logIfDebug('placeholderEnd : ', placeholderEnd);
  _logIfDebug('placeholderLengthWithBrackets : ', placeholderLengthWithBrackets);
  _logIfDebug('placeholderLength : ', placeholderLength);

  byteRange[1] = placeholderPos;
  byteRange[2] = byteRange[1] + placeholderLengthWithBrackets;
  byteRange[3] = pdfWithoutPlaceholder.length - byteRange[2];

  if(doByteRange) {

    let actualByteRange = `/ByteRange [${byteRange.join(' ')}]`;
    actualByteRange += ' '.repeat(byteRangePlaceholder.length - actualByteRange.length);

    _logIfDebug('actualByteRange : ', actualByteRange);

    // Replace the /ByteRange placeholder with the actual ByteRange
    pdfWithoutPlaceholder = Buffer.concat([
      pdfWithoutPlaceholder.slice(0, byteRangePlaceholderPosition),
      Buffer.from(actualByteRange),
      pdfWithoutPlaceholder.slice(byteRangeEnd),
    ]);
  }

  const fileWithPlaceholder = Buffer.from(pdfWithoutPlaceholder);

  // Remove the placeholder signature
  pdfWithoutPlaceholder = Buffer.concat([
    pdfWithoutPlaceholder.slice(0, byteRange[1]),
    pdfWithoutPlaceholder.slice(byteRange[2], byteRange[2] + byteRange[3]),
  ]);



  return { pdfWithoutPlaceholder, byteRange, placeholderLength, fileWithPlaceholder };

}

// inspirated from https://github.com/vbuch/node-signpdf/blob/develop/packages/signpdf/src/signpdf.js
async function getSignablePartOfThePDF(
  file: Buffer,
  
): Promise<{
  signablePartBuffer: Buffer,
  fileWithPlaceholder : Buffer,
}> {

  const pdfDoc    = await PDFDocument.load(file);

  const currentDate = new Date();

  // Ajouter 15 minutes
  currentDate.setMinutes(currentDate.getMinutes() + 15);

  pdflibAddPlaceholder({
    pdfDoc      : pdfDoc,
    reason      : PDF_SEAL_REASON,
    contactInfo : PDF_SEAL_CONTACT_INFO,
    name        : PDF_SEAL_NAME,
    location    : PDF_SEAL_LOCATION,
    signingTime : currentDate,
  //  subFilter: SUBFILTER_ETSI_CADES_DETACHED,
  });

  const fileWithSaved   = await pdfDoc.save();

  const bufferWithPlaceHolder = Buffer.from(fileWithSaved);

  const {pdfWithoutPlaceholder, fileWithPlaceholder} = await _removePlaceHolder(bufferWithPlaceHolder, true);

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
  
  
 

  let { pdfWithoutPlaceholder, placeholderLength, byteRange } = await _removePlaceHolder(file, false);

  const fileHash      = await getFileHash(pdfWithoutPlaceholder); 

  _logIfDebug('sealPDF: fileHash from buffer Prepared: ', fileHash, fileHash.length);

  // const signer = new PKCS7Signer(pkcs7File);
  const raw = pkcs7File; //await signer.sign(pdfWithoutPlaceholder, signingTime);

  // Check if the PDF has a good enough placeholder to fit the signature.
  // placeholderLength represents the length of the HEXified symbols but we're
  // checking the actual lengths.
  if ((raw.length * 2) > placeholderLength)
      throw new SignPdfError( `Signature exceeds placeholder length: ${raw.length * 2} > ${placeholderLength}`, SignPdfError.TYPE_INPUT);
  

  let signature =  raw.toString('hex'); //Buffer.from(raw, 'binary').toString('hex');

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


  // const pdf    = await PDFDocument.load(file);

    // const pkcs7BufferLength = file.length;
  // const uintArray = new Uint8Array(file);
  // const signed = await signpdf.sign(file, signer, signingTime);

  // pdflibAddPlaceholder({
  //   pdfDoc      : pdf,
  //   reason      : PDF_SEAL_REASON,
  //   contactInfo : PDF_SEAL_CONTACT_INFO,
  //   name        : PDF_SEAL_NAME,
  //   location    : PDF_SEAL_LOCATION,
  //   signingTime : new Date(signingTime)
  // });

  //   const fileWithPlaceholder = await pdf.save();
  // const signed = await signpdf.sign(fileWithPlaceholder, signer, signingTime);
  
}
