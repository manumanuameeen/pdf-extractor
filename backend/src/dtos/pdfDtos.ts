import { PDF_MESSAGES } from '../constants/messages.js';
import type { IPdfDtoValidator } from '../contracts/index.js';

export type ExtractPdfPagesDto = {
  pageIndices: number[];
};

export class PdfDtoValidator implements IPdfDtoValidator {
  validateExtractPages(body: unknown): ExtractPdfPagesDto {
    const pages = this.readPages(body);
    const pageIndices = pages.map((page) => {
      const pageNumber = Number(page);

      if (!Number.isInteger(pageNumber)) {
        throw new Error(PDF_MESSAGES.PAGES_MUST_BE_WHOLE_NUMBERS);
      }

      return pageNumber - 1;
    });

    return { pageIndices };
  }

  private readPages(body: unknown): unknown[] {
    if (typeof body !== 'object' || body === null || !('pages' in body)) {
      throw new Error(PDF_MESSAGES.PAGES_MUST_BE_ARRAY);
    }

    const pages = (body as { pages?: unknown }).pages;

    if (!Array.isArray(pages)) {
      throw new Error(PDF_MESSAGES.PAGES_MUST_BE_ARRAY);
    }

    return pages;
  }
}

export default new PdfDtoValidator();
