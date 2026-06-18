# PDF Page Extractor

A professional full-stack PDF manipulation application with secure authentication and persistent user storage. Users can sign up, verify email OTP, manage their own PDF library, extract/reorder pages, and maintain a history of their extractions.

## 🚀 Live Demo
- **Frontend:** [https://pdf-extractor-client.vercel.app](https://pdf-extractor-client.vercel.app)
- **Backend API:** [https://pdf-extractor-backend-eju1.onrender.com](https://pdf-extractor-backend-eju1.onrender.com)

## ✨ Features

- **Secure Authentication:** JWT-based auth with email OTP verification.
- **Persistent User Storage:** Each user has their own private library of uploaded and extracted PDFs.
- **Advanced Extraction:** Select specific pages and **rearrange their order** in the new PDF.
- **PDF Management:** List all your files, preview them, and delete them when no longer needed.
- **Smart Cleanup:** Background job cleans up "orphan" files while preserving user-saved documents.
- **Responsive UI:** Modern, animated interface built with Framer Motion and Tailwind.

## 🏗️ Architecture

The application follows **Clean Architecture** principles with strict layer separation:

- **Contracts (Interfaces):** Define the "shape" of every service, repository, and controller.
- **Services:** Pure business logic (PDF manipulation, Auth flow, Email dispatch via Gmail HTTP API).
- **Repositories:** Data access abstraction (supports both JSON file storage and MongoDB).
- **Controllers:** Handles HTTP request/response cycle and DTO validation.
- **DI Container:** Centralized Dependency Injection root for loose coupling.

### Backend Layers
- `src/contracts`: TypeScript interfaces for all components.
- `src/services`: Implementation of business rules.
- `src/repositories`: Persistence logic (JSON/MongoDB).
- `src/controllers`: Request handlers.
- `src/dtos`: Data Transfer Objects and validation logic.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- Gmail Account (for OTP emails)

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env`
4. Fill in your Gmail OAuth2 credentials (see [ENVIRONMENT.md](ENVIRONMENT.md) for guide).
5. Start development server: `npm run dev`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env`
4. Set `VITE_API_URL=http://localhost:5000`
5. Start development server: `npm run dev`

## 🧪 Testing
The backend includes a comprehensive test suite using the Node.js native test runner:
```bash
cd backend
npm test
```
Tests cover:
- PDF page extraction and rearrangement.
- Page range validation.
- DTO and input validation.
- Auth service logic.

## 📸 Screenshots

### Dashboard & PDF Library
![Dashboard](docs/screenshots/dashboard.png)

### PDF Extraction & Reordering
![Extraction](docs/screenshots/extraction.png)

## 📄 License
MIT
