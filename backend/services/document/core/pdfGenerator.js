import fs from 'fs';
import path from 'path';
import wkhtml from 'wkhtmltopdf';
import { buildHtmlContent, resolveOfferLetterAssets } from './pdfTemplateBuilder.js';

wkhtml.command = process.env.WKHTMLTOPDF_PATH || 'wkhtmltopdf';

const OUTPUT_DIR = process.env.DOCUMENT_OUTPUT_DIR || 'GeneratedDocuments';

function safeFilePart(value) {
  return String(value || 'document')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'document';
}

export async function generatePDFFromData(data) {
  return new Promise((resolve, reject) => {
    const folderPath = path.join(process.cwd(), OUTPUT_DIR);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const rawName = data.metadata?.upperName || data.metadata?.name || data.metadata?.fullName || 'UNKNOWN';
    const upperName = safeFilePart(String(rawName).toUpperCase());
    const docType = data.metadata?.documentType || 'offer';

    let fileName;
    let subFolder = '';

    if (docType === 'appraisal-letter') {
      const ctc = data.metadata?.currentSalary || data.metadata?.ctcPerYear || '';
      const ctcPart = ctc ? `_${safeFilePart(String(ctc))}CTC` : '';
      fileName = `Appraisal_Letter_${upperName}${ctcPart}.pdf`;
      subFolder = 'AppraisalLetter';
    } else if (docType === 'job-offer-letter') {
      const designation = data.metadata?.designation
        ? `_${safeFilePart(data.metadata.designation)}`
        : '';
      fileName = `Job_Offer_Letter_${upperName}${designation}.pdf`;
      subFolder = 'JobOfferLetter';
    } else if (docType === 'internship-offer-letter') {
      const internType = data.metadata?.internType || '';
      const internLabel = internType
        ? safeFilePart(internType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
        : 'Internship';
      fileName = `${internLabel}_Offer_Letter_${upperName}.pdf`;
      subFolder = 'InternshipOfferLetter';
    } else {
      fileName = `Document_${upperName}.pdf`;
      subFolder = 'Miscellaneous';
    }

    const typeFolderPath = path.join(folderPath, subFolder);
    if (!fs.existsSync(typeFolderPath)) {
      fs.mkdirSync(typeFolderPath, { recursive: true });
    }

    const outputFile = path.join(typeFolderPath, fileName);

    let assets;
    try {
      const signatoryName = data.metadata?.signatoryName || '';
      assets = resolveOfferLetterAssets(signatoryName);
    } catch (error) {
      reject(error);
      return;
    }

    wkhtml(buildHtmlContent(data, assets), {
      output: outputFile,
      enableLocalFileAccess: true,
      pageSize: 'A4',
      marginTop: '0',
      marginBottom: '0',
      marginLeft: '0',
      marginRight: '0',
      enableJavascript: false,
      printMediaType: true,
      background: true,
      disableSmartShrinking: true,
      dpi: 300,
      imageDpi: 300,
      imageQuality: 100,
      encoding: 'UTF-8',
      minimumFontSize: 11
    }, (err) => {
      if (err) {
        reject(new Error('PDF generation failed. Please verify wkhtmltopdf is installed and WKHTMLTOPDF_PATH is configured if needed.'));
        return;
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      resolve(`${baseUrl}/${OUTPUT_DIR}/${subFolder}/${fileName}`);
    });
  });
}
