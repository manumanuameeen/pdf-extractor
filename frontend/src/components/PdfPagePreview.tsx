import { useEffect, useRef, useState } from 'react';

export type PdfJsViewport = {
  width: number;
  height: number;
  scale?: number;
};

export type PdfJsPage = {
  getViewport: (opts: { scale: number }) => PdfJsViewport;
  render: (ctx: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => { promise: Promise<void> };
};

export type PdfJsDocument = {
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
};

export type GetDocumentOptions = {
  url: string;
  httpHeaders?: Record<string, string>;
};

export type PdfJsLib = {
  getDocument: (opts: GetDocumentOptions) => { promise: Promise<PdfJsDocument> };
};

type Props = {
  pdfDoc: PdfJsDocument | null;
  pageNumber: number;
  scale?: number;
};

export function PdfPagePreview({ pdfDoc, pageNumber, scale = 0.25 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!pdfDoc) return;

    pdfDoc.getPage(pageNumber).then((page: PdfJsPage) => {
      if (!isMounted) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    }).catch((err: { message?: string } | Error) => {
      console.error(`Error rendering page ${pageNumber}:`, err?.message ?? err);
    });

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div className="preview-container">
      {loading && <div className="spinner-sm" />}
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}
