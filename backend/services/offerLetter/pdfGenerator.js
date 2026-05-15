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

    const upperName = data.metadata?.upperName || data.metadata?.name?.toUpperCase() || 'UNKNOWN';
    const docType = data.metadata?.documentType || data.metadata?.internType || 'offer';
    const fileName = `${safeFilePart(docType)}_Letter_${safeFilePart(upperName)}_${Date.now()}.pdf`;
    const outputFile = path.join(folderPath, fileName);

    let assets;
    try {
      assets = resolveOfferLetterAssets();
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
      resolve(`${baseUrl}/${OUTPUT_DIR}/${fileName}`);
    });
  });
}
