import { PAGE_HEIGHT_MM, TOP_PADDING_MM, BOTTOM_SAFE_MM } from "./pdfLayout.js";

export function repaginateForFooterSafety(
  pages,
  metadata,
  estimateBlockHeightMm,
  replaceVariables = (value) => value,
) {
  const repaginated = [];
  let pageNumber = 1;

  for (const page of pages) {
    let currentParagraphs = [];
    let currentHeight = 0;

    for (const para of page.paragraphs || []) {
      const pageUsableHeight = PAGE_HEIGHT_MM - TOP_PADDING_MM - BOTTOM_SAFE_MM;
      const queue = [para];

      while (queue.length > 0) {
        const block = queue.shift();
        const height = estimateBlockHeightMm(block, metadata, replaceVariables);
        const reserve = block.type === "paragraph" ? 4 : 0;
        const willOverflow =
          currentHeight + height > pageUsableHeight - reserve;

        if (!willOverflow) {
          currentParagraphs.push(block);
          currentHeight += height;
          continue;
        }

        if (currentParagraphs.length > 0) {
          repaginated.push({
            pageNumber: pageNumber++,
            paragraphs: currentParagraphs,
          });
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
      repaginated.push({
        pageNumber: pageNumber++,
        paragraphs: currentParagraphs,
      });
    }
  }

  return repaginated;
}
