import fs from 'fs';
import path from 'path';
import { escapeHtml } from '../../utils/htmlHelpers.js';
import { formatOrdinalDate } from '../../utils/dateFormatter.js';
import { estimateBlockHeightMm } from './pdfLayout.js';
import { repaginateForFooterSafety } from './pdfPagination.js';

const TEMPLATE_DIR = path.join(process.cwd(), 'company', 'template');

function findFirstExistingAsset(candidates) {
  for (const fileName of candidates) {
    const absolutePath = path.join(TEMPLATE_DIR, fileName);
    if (fs.existsSync(absolutePath)) return absolutePath;
  }

  return null;
}

function toFileUrl(absolutePath) {
  return `file:///${absolutePath.replace(/\\/g, '/')}`;
}

export function replaceVariables(text, metadata = {}) {
  if (!text || typeof text !== 'string') return text;

  const variables = {
    name: metadata.name || '',
    upperName: metadata.upperName || metadata.name?.toUpperCase() || '',
    gender: metadata.gender || '',
    internType: metadata.internType || '',
    durationType: metadata.durationType || '',
    duration: metadata.duration || '',
    role: metadata.role || '',
    startDate: formatOrdinalDate(metadata.startDate),
    endDate: formatOrdinalDate(metadata.endDate),
    salaryType: metadata.salaryType || '',
    salaryAmount: metadata.salaryAmount || '',
    date: metadata.date || '',
    companyName: metadata.companyName || '',
    signatoryName: metadata.signatoryName || '',
    signatoryTitle: metadata.signatoryTitle || ''
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (variables[key] === undefined && ['string', 'number'].includes(typeof value)) {
      variables[key] = value;
    }
  }

  return Object.entries(variables).reduce((result, [key, value]) => (
    result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
  ), text);
}

export function resolveOfferLetterAssets() {
  const templatePath = findFirstExistingAsset(['temp.jpg', 'temp.png']);
  const signPath = findFirstExistingAsset(['sign2.png', 'sign.png']);
  const transparentPath = findFirstExistingAsset(['transparent.png']);

  if (!templatePath) {
    throw new Error('Missing document template at backend/company/template/temp.jpg.');
  }

  return {
    templateUrl: toFileUrl(templatePath),
    signUrl: signPath ? toFileUrl(signPath) : null,
    transparentUrl: transparentPath ? toFileUrl(transparentPath) : null
  };
}

export function buildHtmlContent(data, assets) {
  const { templateUrl, signUrl, transparentUrl } = assets;
  const safePages = repaginateForFooterSafety(data.pages || [], data.metadata || {}, estimateBlockHeightMm, replaceVariables);

  const htmlContent = safePages.map((page, pageIndex) => {
    const body = (page.paragraphs || []).map((para) => {
      if (!para.content || !String(para.content).trim()) return '';
      const processedContent = replaceVariables(para.content, data.metadata);

      switch (para.type) {
        case 'date':
          return `<div class="date">${escapeHtml(processedContent)}</div>`;
        case 'to':
          return `<div class="to-line">${processedContent}</div>`;
        case 'subject':
          return `<div class="subject">${escapeHtml(processedContent)}</div>`;
        case 'signature':
          return `<div class="signature-block avoid-break"><div>${processedContent}</div>${signUrl ? `<img src="${signUrl}" class="sign" />` : ''}</div>`;
        case 'company':
          return `<div class="company-name">${escapeHtml(processedContent)}</div>`;
        case 'separator':
          return `<div class="center separator">${escapeHtml(processedContent)}</div>`;
        case 'image':
          return `<div style="margin:10mm 0;"><img src="${para.content}" style="max-width:100%;height:auto;" /></div>`;
        default:
          return `<div class="paragraph-block avoid-break"><p>${escapeHtml(processedContent)}</p></div>`;
      }
    }).join('');

    return `<section class="pdf-page ${pageIndex > 0 ? 'next-page' : ''}"><div class="page-content">${body}</div></section>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
*{margin:0;padding:0;}
@page{size:A4;margin:0;}
html,body{margin:0;padding:0;width:210mm;min-height:297mm;}
body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#000;print-color-adjust:exact;-webkit-print-color-adjust:exact;}
.pdf-page{width:210mm;height:297mm;min-height:297mm;max-height:297mm;position:relative;overflow:hidden;page-break-inside:avoid;background-image:url('${templateUrl}');background-position:center top;background-repeat:no-repeat;background-size:210mm 297mm;}
.next-page{page-break-before:always;break-before:page;}
.pdf-page::after{content:'';position:absolute;inset:0;${transparentUrl ? `background-image:url('${transparentUrl}');background-repeat:no-repeat;background-position:center top;background-size:210mm 297mm;` : ''}pointer-events:none;z-index:0;}
.page-content{box-sizing:border-box;width:210mm;padding:45mm 25mm 34mm;position:relative;z-index:1;font-size:11pt;line-height:1.5;overflow:hidden;}
p{text-align:justify;margin:0;line-height:1.5;text-justify:inter-word;word-wrap:break-word;overflow-wrap:break-word;}
.paragraph-block{margin-bottom:4mm;padding-bottom:1mm;}
.date{text-align:right;margin-bottom:6mm;padding-bottom:1mm;white-space:nowrap;}
.subject{text-align:center;font-weight:700;margin-top:4mm;margin-bottom:4mm;padding-bottom:1mm;}
.to-line{line-height:1.5;margin-bottom:4mm;padding-bottom:1mm;}
.signature-block{margin-top:6mm;line-height:1.5;margin-bottom:4mm;padding-bottom:2mm;}
.signature-block div{margin-bottom:1mm;}
.company-name{margin-top:4mm;margin-bottom:4mm;padding-bottom:2mm;}
.separator{margin-top:4mm;margin-bottom:4mm;padding-bottom:2mm;}
.sign{display:block;width:40mm;height:auto;margin-top:2mm;}
.center{text-align:center;}
</style>
</head>
<body>${htmlContent}</body>
</html>`;
}
