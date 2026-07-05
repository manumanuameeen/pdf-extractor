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

export type SavedPdf = UploadedPdf & {
  createdAt: string;
};

export type ExtractedPdf = {
  fileName: string;
  pageCount: number;
  downloadUrl: string;
};

export type AuthMode = 'login' | 'signup' | 'verify';

export type ToastTone = 'success' | 'error';

export type ToastState = {
  tone: ToastTone;
  message: string;
};

export type AuthFlowState = {
  token: string;
  user: PublicUser | null;
  authMode: AuthMode;
  authName: string;
  authEmail: string;
  authPassword?: string;
  authOtp: string;
  isAuthLoading: boolean;
  otpExpiryTimer: number | null;
  resendCooldown: number | null;
  setAuthMode: (mode: AuthMode) => void;
  setAuthName: (name: string) => void;
  setAuthEmail: (email: string) => void;
  setAuthPassword?: (password: string) => void;
  setAuthOtp: (otp: string) => void;
  handleSignup: () => Promise<void>;
  handleLogin: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleResendOtp: () => Promise<void>;
  handleLogout: () => void;
};

export type PdfWorkspaceState = {
  token: string;
  uploadedPdf: UploadedPdf | null;
  selectedPages: number[];
  uploadProgress: number;
  isDragging: boolean;
  isUploading: boolean;
  isExtracting: boolean;
  extractedPdf: ExtractedPdf | null;
  userPdfs: SavedPdf[];
  libraryLoading: boolean;
  loadUserPdfs: () => Promise<void>;
  handleFileInput: (event: import('react').ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (event: import('react').DragEvent<HTMLLabelElement>) => void;
  selectAllPages: () => void;
  resetWorkspace: () => void;
  extractPages: () => Promise<void>;
  togglePage: (pageNumber: number) => void;
  movePage: (pageNumber: number, direction: -1 | 1) => void;
  clearSelection: () => void;
  setDraggingState: (value: boolean) => void;
  handleSelectLibraryPdf: (pdf: SavedPdf) => void;
  handleDeleteLibraryPdf: (pdfId: string) => Promise<void>;
};
