import { CONTENT_MAX_HEIGHT_MM } from './pdfLayout.js';

export function repaginateForFooterSafety(pages, metadata, estimateBlockHeightMm, replaceVariables = (value) => value) {
  const usableHeight = CONTENT_MAX_HEIGHT_MM;
  const repaginated = [];
  let pageNumber = 1;

  for (const page of pages) {
    let currentParagraphs = [];
    let currentHeight = 0;

    for (const para of page.paragraphs || []) {
      const queue = [para];

      while (queue.length > 0) {
        const block = queue.shift();
        const height = estimateBlockHeightMm(block, metadata, replaceVariables);
        const willOverflow = currentHeight + height > usableHeight;

        if (!willOverflow) {
          currentParagraphs.push(block);
          currentHeight += height;
          continue;
        }

        if (currentParagraphs.length > 0) {
          repaginated.push({ pageNumber: pageNumber++, paragraphs: currentParagraphs });
          currentParagraphs = [];
          currentHeight = 0;
          queue.unshift(block);
        } else {
          currentParagraphs.push(block);
          currentHeight += height;
        }
      }
    }

    if (currentParagraphs.length > 0) {
      repaginated.push({ pageNumber: pageNumber++, paragraphs: currentParagraphs });
    }
  }

  return repaginated;
}

