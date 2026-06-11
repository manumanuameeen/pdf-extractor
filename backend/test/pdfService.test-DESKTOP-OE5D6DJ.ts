import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import pdfService from '../src/services/pdfService.js';

const createSamplePdf = async (): Promise<string> => {
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  pdf.addPage([300, 300]);
  pdf.addPage([300, 300]);

  const filePath = path.join(os.tmpdir(), `sample-${Date.now()}.pdf`);
  await fs.writeFile(filePath, await pdf.save());
  return filePath;
};

test('extractPages creates a new PDF with selected pages in requested order', async () => {
  const sourcePath = await createSamplePdf();
  const outputBuffer = await pdfService.extractPages(sourcePath, [2, 0]);
  const outputPdf = await PDFDocument.load(outputBuffer);

  assert.equal(outputPdf.getPageCount(), 2);
});

test('extractPages rejects pages outside the source PDF range', async () => {
  const sourcePath = await createSamplePdf();

  await assert.rejects(
    () => pdfService.extractPages(sourcePath, [5]),
    /outside the PDF page range/
  );
});
