# Implementation Plan

This project already contains a strong backend architecture with user-owned PDF storage, authentication, and PDF extraction logic. The remaining work is to complete the missing frontend library user experience, add frontend test coverage, and ensure the README clearly documents how to run the code and where the app is hosted.

## Goals

1. Add a saved-PDF library view for authenticated users.
2. Allow users to load a saved PDF into the workspace and delete saved files.
3. Keep all PDF records tied to the current user and persisted by the backend.
4. Add frontend unit tests using Vitest and React Testing Library.
5. Update documentation with clear run instructions, hosted links, and test commands.

## Tasks

### Backend
- Verify the backend already supports:
  - `GET /api/pdfs` for listing user-owned PDFs
  - `DELETE /api/pdfs/:id` for deleting a saved file
  - `POST /api/pdfs/:id/extract` for page extraction and reorder
  - JWT-authenticated routes for ownership enforcement

### Frontend
- Add API endpoints for listing and deleting PDFs.
- Build `frontend/src/services/pdfService.ts`.
- Load the user PDF library after login and on every successful upload/extract/delete.
- Add a library panel inside `frontend/src/App.tsx`.
- Add `Load` and `Delete` actions for each saved PDF.
- Keep the extraction UI and page reorder controls connected to the selected file.

### Tests
- Add Vitest support to `frontend/package.json` and `frontend/vite.config.ts`.
- Create `frontend/src/setupTests.ts` for test setup.
- Add a baseline frontend test for login screen rendering.
- Preserve backend tests already present in `backend/test`.

### Documentation
- Confirm `README.md` contains:
  - frontend + backend run commands
  - test commands for both frontend and backend
  - hosted live frontend and backend links
  - screenshot references

## Deliverables

- `frontend/src/services/pdfService.ts`
- `frontend/src/__tests__/App.test.tsx`
- `frontend/src/setupTests.ts`
- updated `frontend/src/App.tsx`
- updated frontend test scripts in `frontend/package.json`
- updated documentation in `README.md`
- `IMPLEMENTATION_PLAN.md`
