import { PDF_MESSAGES } from '../constants/messages.js';
export class PdfDtoValidator {
    validateExtractPages(body) {
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
    readPages(body) {
        if (typeof body !== 'object' || body === null || !('pages' in body)) {
            throw new Error(PDF_MESSAGES.PAGES_MUST_BE_ARRAY);
        }
        const pages = body.pages;
        if (!Array.isArray(pages)) {
            throw new Error(PDF_MESSAGES.PAGES_MUST_BE_ARRAY);
        }
        return pages;
    }
}
export default new PdfDtoValidator();
