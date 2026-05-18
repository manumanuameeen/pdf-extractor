// import { useMemo, useState, type ChangeEvent } from 'react';
// import http from '../services/http';
// import { API_ENDPOINTS } from '../constants/api';
// import { UI_MESSAGES } from '../constants/messages';
// import type { ExtractedPdf, PublicUser, UploadedPdf } from '../types';

// type Props = {
//   user: PublicUser;
//   onLogout: () => void;
//   showToast: (message: string, tone: 'success' | 'error') => void;
// };

// function parsePageSelection(value: string): number[] {
//   return value
//     .split(',')
//     .map((item) => item.trim())
//     .filter(Boolean)
//     .flatMap((item) => {
//       if (item.includes('-')) {
//         const [start, end] = item.split('-').map((part) => Number(part.trim()));
//         if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start) {
//           return Array.from({ length: end - start + 1 }, (_, index) => start + index);
//         }

//         return [] as number[];
//       }

//       const pageNumber = Number(item);
//       return Number.isInteger(pageNumber) && pageNumber > 0 ? [pageNumber] : [];
//     });
// }

// export function PdfWorkspace({ user, onLogout, showToast }: Props) {
//   const [selectedPages, setSelectedPages] = useState('1');
//   const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null);
//   const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isExtracting, setIsExtracting] = useState(false);

//   const pageCountLabel = useMemo(() => {
//     if (!uploadedPdf) {
//       return 'No PDF uploaded yet.';
//     }

//     return `${uploadedPdf.pageCount} pages available.`;
//   }, [uploadedPdf]);

//   const downloadUrl = extractedPdf
//     ? new URL(extractedPdf.downloadUrl, window.location.origin).toString()
//     : '';

//   const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];

//     if (!file) {
//       return;
//     }

//     if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
//       showToast(UI_MESSAGES.INVALID_PDF, 'error');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('pdf', file);
//     setIsUploading(true);
//     setUploadProgress(0);
//     setExtractedPdf(null);

//     try {
//       const response = await http.post<UploadedPdf>(API_ENDPOINTS.PDFS.UPLOAD, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: (progressEvent) => {
//           if (progressEvent.total) {
//             setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
//           }
//         }
//       });

//       setUploadedPdf(response.data);
//       setSelectedPages('1');
//       showToast(UI_MESSAGES.PDF_UPLOADED, 'success');
//     } catch (error) {
//       showToast(UI_MESSAGES.UPLOAD_FAILED, 'error');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const selectAllPages = () => {
//     if (!uploadedPdf) {
//       return;
//     }

//     setSelectedPages(Array.from({ length: uploadedPdf.pageCount }, (_value, index) => index + 1).join(', '));
//   };

//   const handleExtractPages = async () => {
//     if (!uploadedPdf) {
//       showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error');
//       return;
//     }

//     const pages = parsePageSelection(selectedPages);

//     if (pages.length === 0) {
//       showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error');
//       return;
//     }

//     setIsExtracting(true);

//     try {
//       const response = await http.post<ExtractedPdf>(API_ENDPOINTS.PDFS.EXTRACT(uploadedPdf.id), {
//         pages,
//       });

//       setExtractedPdf(response.data);
//       showToast(UI_MESSAGES.EXTRACTION_SUCCESS, 'success');
//     } catch (error) {
//       showToast(UI_MESSAGES.EXTRACTION_FAILED, 'error');
//     } finally {
//       setIsExtracting(false);
//     }
//   };

//   return (
//     <main className="workspace-shell">
//       <header className="workspace-header">
//         <div>
//           <h1>Welcome, {user.name}</h1>
//           <p>{pageCountLabel}</p>
//         </div>
//         <button type="button" onClick={onLogout} className="btn-secondary">
//           Logout
//         </button>
//       </header>

//       <section className="upload-panel">
//         <label className="field label-file">
//           <span>Upload PDF</span>
//           <input type="file" accept="application/pdf" onChange={handleFileInput} disabled={isUploading} />
//         </label>

//         {isUploading && <progress value={uploadProgress} max={100}>{uploadProgress}%</progress>}
//         {uploadedPdf && <p>{uploadedPdf.name} ({Math.round(uploadedPdf.size / 1024)} KB)</p>}
//       </section>

//       {uploadedPdf && (
//         <section className="extract-panel">
//           <label className="field">
//             <span>Select pages</span>
//             <input
//               value={selectedPages}
//               onChange={(event) => setSelectedPages(event.target.value)}
//               placeholder="e.g. 1, 3-5"
//             />
//           </label>
//           <div className="action-group">
//             <button type="button" onClick={selectAllPages} className="btn-secondary">
//               Select all pages
//             </button>
//             <button type="button" onClick={handleExtractPages} disabled={isExtracting}>
//               {isExtracting ? 'Extracting...' : 'Extract pages'}
//             </button>
//           </div>
//         </section>
//       )}

//       {extractedPdf && (
//         <section className="download-panel">
//           <p>{extractedPdf.fileName} is ready.</p>
//           <a className="btn-primary" href={downloadUrl} target="_blank" rel="noreferrer">
//             Download extracted PDF
//           </a>
//         </section>
//       )}
//     </main>
//   );
// }


import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
import http from '../services/http';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { UI_MESSAGES } from '../constants/messages';
import type { ExtractedPdf, PublicUser, UploadedPdf } from '../types';
import { PdfPagePreview } from './PdfPagePreview';
import type { PdfJsDocument, PdfJsLib, GetDocumentOptions } from './PdfPagePreview';
import { updateProfile } from '../services/authService';

type Props = {
  user: PublicUser;
  onUpdateUser: (updated: PublicUser) => void;
  onLogout: () => void;
  showToast: (message: string, tone: 'success' | 'error') => void;
};

function parsePageSelection(value: string): number[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      if (item.includes('-')) {
        const [start, end] = item.split('-').map((part) => Number(part.trim()));
        if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start) {
          return Array.from({ length: end - start + 1 }, (_value, index) => start + index);
        }
        return [] as number[];
      }

      const pageNumber = Number(item);
      return Number.isInteger(pageNumber) && pageNumber > 0 ? [pageNumber] : [];
    });
}

export function PdfWorkspace({ user, onUpdateUser, onLogout, showToast }: Props) {
  const [selectedPages, setSelectedPages] = useState('1');
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null);
  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // PDF.js document state
  const [pdfDoc, setPdfDoc] = useState<PdfJsDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState<number | null>(null);

  // Profile editing state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  
  useEffect(() => {
    setEditName(user.name);
  }, [user.name]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await updateProfile(editName);
      onUpdateUser(updatedUser);
      showToast('Name updated successfully!', 'success');
      setIsProfileOpen(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update profile.';
      showToast(errMsg, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };


  useEffect(() => {
    if (!uploadedPdf) {
      setPdfDoc(null);
      return;
    }

    setLoadingDoc(true);
    const token = localStorage.getItem('pdf_extractor_token');
    const pdfUrl = `${API_BASE_URL}${uploadedPdf.previewUrl}`;
    const pdfjs = (window as Window & { pdfjsLib?: PdfJsLib }).pdfjsLib;

    if (!pdfjs) {
      console.error('PDF.js library not loaded in window!');
      setLoadingDoc(false);
      return;
    }

    let isMounted = true;

    const getDocOpts: GetDocumentOptions = {
      url: pdfUrl,
      httpHeaders: {
        Authorization: `Bearer ${token}`
      }
    };

    pdfjs.getDocument(getDocOpts).promise.then((loadedPdf: PdfJsDocument) => {
      if (isMounted) {
        setPdfDoc(loadedPdf);
        setLoadingDoc(false);
      }
    }).catch((err: { message?: string } | Error) => {
      console.error('Error loading PDF via PDF.js:', err?.message ?? err);
      if (isMounted) {
        setLoadingDoc(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uploadedPdf]);

  const pageSummary = useMemo(() => {
    if (!uploadedPdf) return 'Upload a PDF to begin.';
    return `${uploadedPdf.pageCount} pages ready for extraction.`;
  }, [uploadedPdf]);

  const downloadUrl = extractedPdf
    ? new URL(extractedPdf.downloadUrl, API_BASE_URL).toString()
    : '';

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast(UI_MESSAGES.INVALID_PDF, 'error');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    setIsUploading(true);
    setUploadProgress(0);
    setExtractedPdf(null);

    try {
      const response = await http.post<UploadedPdf>(API_ENDPOINTS.PDFS.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        }
      });

      setUploadedPdf(response.data);
      setSelectedPages('1');
      showToast(UI_MESSAGES.PDF_UPLOADED, 'success');
    } catch {
      showToast(UI_MESSAGES.UPLOAD_FAILED, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const selectAllPages = () => {
    if (!uploadedPdf) return;
    setSelectedPages(Array.from({ length: uploadedPdf.pageCount }, (_v, index) => index + 1).join(', '));
  };

  const handleReset = () => {
    setUploadedPdf(null);
    setExtractedPdf(null);
    setSelectedPages('1');
    setPdfDoc(null);
  };

  const handleTogglePage = (pageNumber: number) => {
    const currentPages = parsePageSelection(selectedPages);
    let newPages: number[];
    if (currentPages.includes(pageNumber)) {
      newPages = currentPages.filter((p) => p !== pageNumber);
    } else {
      newPages = [...currentPages, pageNumber].sort((a, b) => a - b);
    }
    setSelectedPages(newPages.join(', '));
  };

  const handleExtractPages = async () => {
    if (!uploadedPdf) {
      showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error');
      return;
    }

    const pages = parsePageSelection(selectedPages);
    if (pages.length === 0) {
      showToast(UI_MESSAGES.SELECT_PAGE_FIRST, 'error');
      return;
    }

    setIsExtracting(true);

    try {
      const response = await http.post<ExtractedPdf>(API_ENDPOINTS.PDFS.EXTRACT(uploadedPdf.id), {
        pages
      });

      setExtractedPdf(response.data);
      showToast(UI_MESSAGES.EXTRACTION_SUCCESS, 'success');
    } catch {
      showToast(UI_MESSAGES.EXTRACTION_FAILED, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="workspace-shell">
      <div className="workspace-topbar">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h2>{user.name}</h2>
          <p>{pageSummary}</p>
        </div>

        <div className="user-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="button" className="btn-secondary" onClick={() => setIsProfileOpen(true)}>
            Edit Profile
          </button>
          <button type="button" className="btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="panel-card upload-card">
          <div className="panel-head">
            <span className="eyebrow">Step 1</span>
            <h3>Upload your PDF</h3>
          </div>

          <label className="file-upload">
            <input type="file" accept="application/pdf" onChange={handleFileInput} disabled={isUploading} />
            <div className="upload-preview">
              <strong>{uploadedPdf ? uploadedPdf.name : 'Drop your PDF or click to browse'}</strong>
              <span>{uploadedPdf ? `${Math.round(uploadedPdf.size / 1024)} KB • ${uploadedPdf.pageCount} pages` : 'PDF only (max 20MB)'}</span>
            </div>
          </label>

          {isUploading && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </section>

        <section className="panel-card extract-card">
          <div className="panel-head">
            <span className="eyebrow">Step 2</span>
            <h3>Choose pages</h3>
          </div>

          <label className="field">
            <span>Pages to extract</span>
            <input
              value={selectedPages}
              onChange={(event) => setSelectedPages(event.target.value)}
              placeholder="e.g. 1, 3-5"
              disabled={!uploadedPdf || isExtracting}
            />
          </label>

          {uploadedPdf && (
            <div className="visual-page-selector">
              <span className="visual-selector-title">Click a page to zoom & read, or toggle checkbox:</span>
              {loadingDoc ? (
                <div className="doc-loading">
                  <div className="spinner-sm" />
                  <span>Loading page previews...</span>
                </div>
              ) : (
                <div className="page-grid">
                  {Array.from({ length: uploadedPdf.pageCount }, (_v, i) => i + 1).map((pageNumber) => {
                    const isSelected = parsePageSelection(selectedPages).includes(pageNumber);
                    return (
                      <div
                        key={pageNumber}
                        className={`page-grid-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setActivePreviewPage(pageNumber)}
                      >
                        <div className="page-card-preview-area">
                          {pdfDoc ? (
                            <PdfPagePreview pdfDoc={pdfDoc} pageNumber={pageNumber} scale={0.2} />
                          ) : (
                            <div className="preview-placeholder">Page {pageNumber}</div>
                          )}
                        </div>
                        <div className="page-card-footer" onClick={(e) => e.stopPropagation()}>
                          <label className="card-checkbox-label">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTogglePage(pageNumber)}
                            />
                            <span className="checkbox-text">Page {pageNumber}</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="action-group">
            <button type="button" className="btn-secondary" onClick={selectAllPages} disabled={!uploadedPdf}>
              Select all
            </button>
            <button type="button" className="btn-primary" onClick={handleExtractPages} disabled={!uploadedPdf || isExtracting}>
              {isExtracting ? 'Extracting...' : 'Extract pages'}
            </button>
          </div>
        </section>

        <section className="panel-card result-card">
          <div className="panel-head">
            <span className="eyebrow">Step 3</span>
            <h3>Download result</h3>
          </div>

          {extractedPdf ? (
            <div className="result-content">
              <p>
                <strong>{extractedPdf.fileName}</strong> is ready to download.
              </p>
              <div className="action-group">
                <a className="btn-primary" href={downloadUrl} target="_blank" rel="noreferrer">
                  Download extracted PDF
                </a>
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Extract Another PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No extracted file yet. Run extraction to download your PDF.</p>
            </div>
          )}
        </section>
      </div>

      {/* Dynamic PDF Zoom Overlay Modal */}
      {activePreviewPage !== null && uploadedPdf && pdfDoc && (
        <div className="modal-overlay" onClick={() => setActivePreviewPage(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Page {activePreviewPage} Full View</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActivePreviewPage(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <PdfPagePreview pdfDoc={pdfDoc} pageNumber={activePreviewPage} scale={0.8} />
            </div>

            <div className="modal-footer">
              <label className="card-checkbox-label large">
                <input
                  type="checkbox"
                  checked={parsePageSelection(selectedPages).includes(activePreviewPage)}
                  onChange={() => handleTogglePage(activePreviewPage)}
                />
                <span className="checkbox-text">Select Page {activePreviewPage}</span>
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActivePreviewPage(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Editing Modal */}
      {isProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile Settings</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsProfileOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', minHeight: 'unset', background: 'transparent' }}>
                <label className="field" style={{ width: '100%' }}>
                  <span>Email address</span>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </label>

                <label className="field" style={{ width: '100%' }}>
                  <span>Profile Name</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={isSavingProfile}
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsProfileOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}