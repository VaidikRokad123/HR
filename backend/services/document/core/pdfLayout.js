import { stripHtml } from '../../../utils/htmlHelpers.js';

export const TOP_PADDING_MM = 45;
export const SIDE_PADDING_MM = 25;
export const BOTTOM_SAFE_MM = 34;
export const PAGE_HEIGHT_MM = 297;
export const CONTENT_MAX_HEIGHT_MM = PAGE_HEIGHT_MM - TOP_PADDING_MM - BOTTOM_SAFE_MM;
export const CONTENT_WIDTH_MM = 210 - (SIDE_PADDING_MM * 2);
export const BASE_FONT_SIZE_PT = 11;
export const BASE_FONT_LINE_HEIGHT = 1.5;
export const FONT_MM = BASE_FONT_SIZE_PT * 0.352778;
export const LINE_MM = FONT_MM * BASE_FONT_LINE_HEIGHT;

export function estimateTextUnits(text = '') {
  let units = 0;

  for (const ch of text) {
    if (ch === ' ') units += 0.33;
    else if (/[ilI1|.,'`]/.test(ch)) units += 0.35;
    else if (/[mwMW@#%&]/.test(ch)) units += 0.9;
    else if (/[A-Z]/.test(ch)) units += 0.68;
    else if (/[0-9]/.test(ch)) units += 0.56;
    else units += 0.55;
  }

  return units;
}

export function estimateWrappedLineCount(text = '') {
  const plain = stripHtml(text).replace(/\s+/g, ' ').trim();
  if (!plain) return 1;

  const unitWidthMm = FONT_MM * 0.48;
  const maxUnitsPerLine = Math.max(1, CONTENT_WIDTH_MM / unitWidthMm);
  const words = plain.split(' ');

  let lines = 1;
  let currentUnits = 0;

  for (const word of words) {
    const wordUnits = estimateTextUnits(word);
    const withSpace = currentUnits === 0 ? wordUnits : wordUnits + 0.33;

    if (withSpace > maxUnitsPerLine) {
      const forcedLines = Math.max(1, Math.ceil(wordUnits / maxUnitsPerLine));
      lines += forcedLines - (currentUnits === 0 ? 0 : 1);
      currentUnits = wordUnits % maxUnitsPerLine;
      continue;
    }

    if (currentUnits + withSpace > maxUnitsPerLine) {
      lines += 1;
      currentUnits = wordUnits;
    } else {
      currentUnits += withSpace;
    }
  }

  return Math.max(1, lines);
}

export function estimateBlockHeightMm(para, metadata, replaceVariables = (value) => value) {
  const content = replaceVariables(para.content || '', metadata);
  const plainText = stripHtml(content).trim();

  switch (para.type) {
    case 'title': {
      const titleFontMm = 14 * 0.352778 * 1.5;
      const lineCount = Math.max(1, estimateWrappedLineCountWithWidth(plainText, 14));
      return (lineCount * titleFontMm) + 5;
    }
    case 'date':
      return LINE_MM + 4;
    case 'to':
      return (Math.max(1, content.split(/<br\s*\/?>/i).length) * LINE_MM) + 3;
    case 'subject':
      return LINE_MM + 5;
    case 'info-line':
      return LINE_MM + 2;
    case 'signature':
      return (Math.max(1, content.split(/<br\s*\/?>/i).length) * LINE_MM) + 18;
    case 'company':
    case 'separator':
      return LINE_MM + 6;
    case 'footer':
      return (estimateWrappedLineCount(content) * LINE_MM) + 3;
    case 'image':
      return 75;
    default:
      return (estimateWrappedLineCount(plainText) * LINE_MM) + 3;
  }
}

function estimateWrappedLineCountWithWidth(text = '', fontSizePt) {
  const plain = stripHtml(text).replace(/\s+/g, ' ').trim();
  if (!plain) return 1;

  const fontMm = fontSizePt * 0.352778;
  const unitWidthMm = fontMm * 0.48;
  const maxUnitsPerLine = Math.max(1, CONTENT_WIDTH_MM / unitWidthMm);
  const words = plain.split(' ');

  let lines = 1;
  let currentUnits = 0;

  for (const word of words) {
    const wordUnits = estimateTextUnits(word);
    const withSpace = currentUnits === 0 ? wordUnits : wordUnits + 0.33;

    if (withSpace > maxUnitsPerLine) {
      const forcedLines = Math.max(1, Math.ceil(wordUnits / maxUnitsPerLine));
      lines += forcedLines - (currentUnits === 0 ? 0 : 1);
      currentUnits = wordUnits % maxUnitsPerLine;
      continue;
    }

    if (currentUnits + withSpace > maxUnitsPerLine) {
      lines += 1;
      currentUnits = wordUnits;
    } else {
      currentUnits += withSpace;
    }
  }

  return Math.max(1, lines);
}
