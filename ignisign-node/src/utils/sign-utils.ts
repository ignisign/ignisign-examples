import { PDFDocument } from 'pdf-lib';
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import signpdf from '@signpdf/signpdf';
import { Signer} from '@signpdf/utils';



const  PDF_SEAL_CONTACT_INFO = "example contact info";
const  PDF_SEAL_LOCATION = "luxembourg";
const  PDF_SEAL_NAME = "example name";
const  PDF_SEAL_REASON = "sealed by ignisign";

export const SignPdfService = {
  sealPDF
};




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
  pkcs7File: Buffer
): Promise<Buffer> {
  
  const signer = new PKCS7Signer(pkcs7File);
  const signed = await signpdf.sign(file, signer, new Date());

  const pdf    = await PDFDocument.load(file);

  pdflibAddPlaceholder({
    pdfDoc      : pdf,
    reason      : PDF_SEAL_REASON,
    contactInfo : PDF_SEAL_CONTACT_INFO,
    name        : PDF_SEAL_NAME,
    location    : PDF_SEAL_LOCATION,
  });

  return Buffer.from(signed);
}
