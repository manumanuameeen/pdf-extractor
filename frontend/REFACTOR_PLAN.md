# Frontend Refactor Plan

## Goal
Refactor the frontend so the main app logic is separated into focused modules, with routing centralized in one place, reusable UI components grouped by responsibility, and API/state interactions handled through dedicated hooks or services.

## Persistence Principle
Every layer must follow the rule that application data is stored in the database and the UI should reflect that source of truth. In practice this means:
- create, update, and delete actions must be sent to the backend and persisted through the database
- the frontend should read and refresh state from backend responses rather than treating local state as the primary storage
- services and hooks must be designed around backend-backed data flows, including auth, uploaded PDFs, extracted files, and library items

## Proposed Structure

### 1. App shell and routing
- Keep App.tsx as a thin entry point that renders the app shell.
- Create a single routing file for all page-level routes, such as:
  - src/routes/AppRouter.tsx
- Define route-level pages separately, for example:
  - src/pages/AuthPage.tsx
  - src/pages/WorkspacePage.tsx

### 2. Feature-based component groups
Split the current UI into focused components instead of keeping everything in one file:
- src/components/auth/
  - AuthForm.tsx
  - OtpVerificationForm.tsx
  - AuthTabs.tsx
- src/components/workspace/
  - UploadPanel.tsx
  - LibraryPanel.tsx
  - Toolbar.tsx
  - PageGrid.tsx
  - PageCard.tsx
  - EmptyState.tsx
  - DownloadPanel.tsx
- src/components/common/
  - Toast.tsx
  - ErrorBoundary.tsx

### 3. State and behavior separation
Move app-level logic out of App.tsx into focused hooks or modules:
- src/hooks/useAuthFlow.ts
- src/hooks/usePdfWorkspace.ts
- src/hooks/useToast.ts

These hooks will own:
- authentication state and OTP flow
- PDF upload/extract/select/reorder behavior
- toast notifications and session restore

### 4. Service layer cleanup
Keep API calls in dedicated services and avoid inline request logic inside UI components:
- src/services/authService.ts (existing)
- src/services/pdfService.ts (existing)
- Add shared request helpers if needed for upload/extract flow

### 5. Shared types and utilities
- Keep shared types in src/types/
- Move formatting helpers and small utilities into src/utils/
  - fileSize.ts
  - assetUrl.ts

### 6. Styling
- Keep CSS scoped to the relevant component or section where possible.
- Avoid mixing unrelated UI styles in a single global file where practical.

## Implementation Order
1. Create route structure and page components.
2. Extract auth screen into dedicated auth components.
3. Extract workspace UI into dedicated workspace components.
4. Move business logic into hooks/services.
5. Wire the new structure into App.tsx through the router.
6. Run build and tests and fix any integration issues.

## Acceptance Criteria
- App.tsx is no longer responsible for all UI and handler logic.
- Routing lives in one centralized file.
- Each component has a single, clear purpose.
- Authentication and PDF workspace logic are reusable and easier to maintain.
- The app still works with the same user flow.
