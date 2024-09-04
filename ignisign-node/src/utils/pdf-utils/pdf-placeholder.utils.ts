import { PDFDocument, PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFInvalidObject, PDFString, } from 'pdf-lib';
import _ = require('lodash');

import { 
  ANNOTATION_FLAGS, DEFAULT_BYTE_RANGE_PLACEHOLDER, DEFAULT_SIGNATURE_LENGTH, 
  PDF_UTILS_ERROR_TYPE, PdfUtilsError, 
  SIG_FLAGS, SUBFILTER_ADOBE_PKCS7_DETACHED, SUBFILTER_ETSI_CADES_DETACHED 
} from './pdf-utils.const';


const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }

const  PDF_SEAL_CONTACT_INFO  = "info@ignisign.io";
const  PDF_SEAL_LOCATION      = "Luxembourg";
const  PDF_SEAL_NAME          = "Digitally Signed by Ignisign Example";
const  PDF_SEAL_REASON        = "Signed by Ignisign";

// inspirated from https://github.com/vbuch/node-signpdf/blob/develop/packages/signpdf/src/signpdf.js

export const PdfPlaceholderUtisService = {
  addPlaceholder,
  removePlaceHolder,
  findByteRange
}

async function addPlaceholder(file: Buffer, isCades = false) : Promise<Buffer> {

  const pdfDoc    = await PDFDocument.load(file);

  const currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() + 15); // add 15 minutes

  _addPlaceholder({
    pdfDoc      : pdfDoc,
    reason      : PDF_SEAL_REASON,
    contactInfo : PDF_SEAL_CONTACT_INFO,
    name        : PDF_SEAL_NAME,
    location    : PDF_SEAL_LOCATION,
    signingTime : currentDate,
    ...(isCades ? {subFilter: SUBFILTER_ETSI_CADES_DETACHED} : {}),
  });

  const pdfBytes = await pdfDoc.save();

  const bufferWithPlaceHolder = Buffer.from(pdfBytes);

  return bufferWithPlaceHolder;
}

function _addPlaceholder({
  pdfDoc = undefined,
  pdfPage = undefined,
  reason,
  contactInfo,
  name,
  location,
  signingTime           = undefined,
  signatureLength       = DEFAULT_SIGNATURE_LENGTH,
  byteRangePlaceholder  = DEFAULT_BYTE_RANGE_PLACEHOLDER,
  subFilter             = SUBFILTER_ADOBE_PKCS7_DETACHED,
  widgetRect            = [0, 0, 0, 0],
  appName               = undefined,
})  {

  if (pdfDoc === undefined && pdfPage === undefined)
      throw new PdfUtilsError('PDFDoc or PDFPage must be set.',PDF_UTILS_ERROR_TYPE.TYPE_INPUT);
  
  const doc   = pdfDoc ?? pdfPage.doc;
  const page  = pdfPage ?? doc.getPages()[0];

  // Create a placeholder where the the last 3 parameters of the actual range will be replaced when signing is done.
  
  const byteRange = PDFArray.withContext(doc.context);
  byteRange.push(PDFNumber.of(0));
  byteRange.push(PDFName.of(byteRangePlaceholder));
  byteRange.push(PDFName.of(byteRangePlaceholder));
  byteRange.push(PDFName.of(byteRangePlaceholder));

  // Fill the contents of the placeholder with 00s.
  const placeholder = PDFHexString.of(String.fromCharCode(0).repeat(signatureLength));

  // Create a signature dictionary to be referenced in the signature widget.
  const appBuild = appName ? {App: {Name: appName}} : {};

  const signatureDict = doc.context.obj({
      Type        : 'Sig',
      Filter      : 'Adobe.PPKLite',
      SubFilter   : subFilter,
      ByteRange   : byteRange,
      Contents    : placeholder,
      Reason      : PDFString.of(reason),
      M           : PDFString.fromDate(signingTime ?? new Date()),
      ContactInfo : PDFString.of(contactInfo),
      Name        : PDFString.of(name),
      Location    : PDFString.of(location),

      Prop_Build: {
          Filter: {Name: 'Adobe.PPKLite'},
          ...appBuild,
      },
  });

  // Register signatureDict as a PDFInvalidObject to prevent PDFLib from serializing it
  // in an object stream.
  const signatureBuffer = new Uint8Array(signatureDict.sizeInBytes());

  signatureDict.copyBytesInto(signatureBuffer, 0);
  const signatureObj      = PDFInvalidObject.of(signatureBuffer);
  const signatureDictRef  = doc.context.register(signatureObj);

  // Create the signature widget
  const rect = PDFArray.withContext(doc.context);
  widgetRect.forEach((c) => rect.push(PDFNumber.of(c)));
  const apStream = doc.context.formXObject([], {
      BBox: widgetRect,
      Resources: {}, // Necessary to avoid Acrobat bug (see https://stackoverflow.com/a/73011571)
  });

  const widgetDict = doc.context.obj({
      Type      : 'Annot',
      Subtype   : 'Widget',
      FT        : 'Sig',
      Rect      : rect,
      V         : signatureDictRef,
      T         : PDFString.of('Signature1'),
      F         : ANNOTATION_FLAGS.PRINT,
      P         : page.ref,
      AP        : { N: doc.context.register(apStream) }, // Required for PDF/A compliance
  });

  const widgetDictRef = doc.context.register(widgetDict);


  let annotations = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray); // Annotate the widget on the given page

  if (typeof annotations === 'undefined')
      annotations = doc.context.obj([]);
  
  annotations.push(widgetDictRef);
  page.node.set(PDFName.of('Annots'), annotations);

  
  let acroForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict); // Add an AcroForm or update the existing one

  if (typeof acroForm === 'undefined') {
      // Need to create a new AcroForm
      acroForm = doc.context.obj({Fields: []});
      const acroFormRef = doc.context.register(acroForm);
      doc.catalog.set(PDFName.of('AcroForm'), acroFormRef);
  }

  const sigFlags = (acroForm.has(PDFName.of('SigFlags')))
      ? acroForm.get(PDFName.of('SigFlags'))          // Already has some flags, will merge
      : PDFNumber.of(0);                              // Create blank flags         

  const updatedFlags = PDFNumber.of( sigFlags.asNumber() | SIG_FLAGS.SIGNATURES_EXIST | SIG_FLAGS.APPEND_ONLY);
  acroForm.set(PDFName.of('SigFlags'), updatedFlags);

  const fields = acroForm.get(PDFName.of('Fields'));
  fields.push(widgetDictRef);
};

function removeTrailingNewLine(pdf : Buffer) : Buffer {
  
  const __sliceLastChar = (pdf, character) => {
    const lastChar = pdf.subarray(pdf.length - 1).toString();

    if (lastChar === character)
        return pdf.subarray(0, pdf.length - 1);
    
    return pdf;
  };

  let output = pdf;

  output = __sliceLastChar(output, '\n');
  output = __sliceLastChar(output, '\r');

  const lastLine = output.subarray(output.length - 6).toString();

  if (lastLine !== '\n%%EOF' && lastLine !== '\r%%EOF')
      throw new PdfUtilsError('A PDF file must end with an EOF line.', PDF_UTILS_ERROR_TYPE.TYPE_PARSE );
  
  return output;
};

async function removePlaceHolder(bufferWithPlaceHolder: Buffer, doByteRange = true)
 : Promise<{
    pdfWithoutPlaceholder: Buffer,
    byteRange: number[],
    placeholderLength: number,
    fileWithPlaceholder : Buffer,

  }> {

  let pdfWithoutPlaceholder = removeTrailingNewLine(bufferWithPlaceHolder);

  // Find the ByteRange placeholder.
  const {byteRangePlaceholder, byteRangePlaceholderPosition} = await findByteRange(pdfWithoutPlaceholder, doByteRange);

  if (!byteRangePlaceholder && doByteRange)
      throw new PdfUtilsError('No ByteRangeStrings found within PDF buffer.', PDF_UTILS_ERROR_TYPE.TYPE_PARSE,);

  // Calculate the actual ByteRange that needs to replace the placeholder.
  const byteRangeEnd    = byteRangePlaceholderPosition + byteRangePlaceholder.length;
  const contentsTagPos  = pdfWithoutPlaceholder.indexOf('/Contents ', byteRangeEnd);
  const placeholderPos  = pdfWithoutPlaceholder.indexOf('<', contentsTagPos);
  const placeholderEnd  = pdfWithoutPlaceholder.indexOf('>', placeholderPos);

  const placeholderLengthWithBrackets = (placeholderEnd + 1) - placeholderPos;
  const placeholderLength             = placeholderLengthWithBrackets - 2;
  const byteRange = [0, 0, 0, 0];

  _logIfDebug('byteRangePlaceholder : '         , byteRangePlaceholder);
  _logIfDebug('byteRangePlaceholderPosition : ' , byteRangePlaceholderPosition);
  _logIfDebug('byteRangeEnd : '   , byteRangeEnd);
  _logIfDebug('contentsTagPos : ' , contentsTagPos);
  _logIfDebug('placeholderPos : ' , placeholderPos);
  _logIfDebug('placeholderEnd : ' , placeholderEnd);
  _logIfDebug('placeholderLengthWithBrackets : ', placeholderLengthWithBrackets);
  _logIfDebug('placeholderLength : ', placeholderLength);

  byteRange[1] = placeholderPos;// -1; //(- 1 added)
  byteRange[2] = byteRange[1] + placeholderLengthWithBrackets;// + 1; // (+ 1 added)
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
    pdfWithoutPlaceholder.slice(0, byteRange[1]), // (+ 1 added)
    pdfWithoutPlaceholder.slice(byteRange[2], byteRange[2] + byteRange[3]), // (+ 1 added) // (+ 1 added)
  ]);

  return { 
    pdfWithoutPlaceholder, 
    fileWithPlaceholder,
    byteRange, 
    placeholderLength, 
  };

}

async function findByteRange(pdf : Buffer, chechWithDefaultPlaceholder=true) {

  const placeholder = DEFAULT_BYTE_RANGE_PLACEHOLDER;

  if (!(pdf instanceof Buffer))
      throw new PdfUtilsError( 'PDF expected as Buffer.', PDF_UTILS_ERROR_TYPE.TYPE_INPUT );

  let byteRangePlaceholder;
  let byteRangePlaceholderPosition;

  const byteRangeStrings  = [];
  const byteRanges        = [];
  let offset              = 0;

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

            if (typeof byteRangePlaceholder !== 'undefined')
                throw new PdfUtilsError( 'Found multiple ByteRange placeholders.', PDF_UTILS_ERROR_TYPE.TYPE_INPUT );

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
