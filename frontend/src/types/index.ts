export type PublicUser = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  profilePhotoUrl?: string | null;
};

export type UploadedPdf = {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  previewUrl: string;
};

export type ExtractedPdf = {
  fileName: string;
  pageCount: number;
  downloadUrl: string;
};

export type AuthMode = 'login' | 'signup' | 'verify';
