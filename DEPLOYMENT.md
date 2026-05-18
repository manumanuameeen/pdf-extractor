# 🚀 Deployment Guide: Deploying PDF Extractor to production

This guide outlines the step-by-step instructions to host and launch your **PDF Extractor** web application:
1. **Backend Web Service** hosted on **Render** (Node.js + Express + TypeScript).
2. **Frontend Client** hosted on **Vercel** (React + Vite + Tailwind/Custom CSS).

---

## 🛠️ Step 1: Deploy Backend to Render

[Render](https://render.com) is an excellent hosting platform for Node.js/TypeScript Express APIs.

### 1. Preparations
* Make sure your project is pushed to a **GitHub** or **GitLab** repository.

### 2. Create a Render Web Service
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   * **Name**: `pdf-extractor-backend` (or similar)
   * **Language**: `Node`
   * **Branch**: `main` (or your active branch)
   * **Root Directory**: `backend` *(CRITICAL: Tell Render to run inside the backend folder!)*
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
   * **Instance Type**: **Free** (or any tier of your choice)

### 3. Add Environment Variables
Under the **Environment** tab in your Render Web Service dashboard, add the following variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set node environment to production |
| `PORT` | `10000` | (Optional, Render injects this dynamically) |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | `your_super_secret_jwt_key` | Secret key for JWT access tokens |
| `REFRESH_SECRET` | `your_super_secret_refresh_key` | Secret key for JWT refresh tokens |
| `EMAIL_USER` | `smtp-username` | (Optional) SMTP Email username for OTPs |
| `EMAIL_PASS` | `smtp-password` | (Optional) SMTP Email password for OTPs |
| `EMAIL_HOST` | `smtp.mailtrap.io` | (Optional) SMTP host address |
| `EMAIL_PORT` | `2525` | (Optional) SMTP port |

4. Click **Create Web Service**. Render will install, build your TypeScript code to `/dist`, and spin up the server!
5. **Copy your Render Web Service URL** (e.g. `https://pdf-extractor-backend.onrender.com`). You will need this for the Vercel frontend.

---

## 💻 Step 2: Deploy Frontend to Vercel

[Vercel](https://vercel.com) provides instant, global hosting for single-page React/Vite frontends.

### 1. Create a Vercel Project
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** -> **Project**.
3. Import the same GitHub repository.

### 2. Configure Build Settings
In the configuration panel:
1. **Framework Preset**: Choose **Vite**.
2. **Root Directory**: Click "Edit" and choose `frontend`. *(CRITICAL: Tells Vercel to build the frontend folder!)*
3. **Build & Development Settings**: Keep the defaults:
   * Build Command: `vite build`
   * Output Directory: `dist`
   * Install Command: `npm install`

### 3. Configure Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://pdf-extractor-backend.onrender.com` | The exact URL of your deployed Render backend (no trailing slash) |

4. Click **Deploy**. Vercel will install dependencies, compile your React application, bundles your CSS, and host your app live!
5. Vercel will generate a secure frontend URL (e.g., `https://pdf-extractor.vercel.app`).

---

## 🔒 Step 3: Connect MongoDB Atlas Whitelist
Because Render services run in dynamic hosting clusters, they do not have a single fixed static IP address. 
* To ensure your Render backend can connect to MongoDB Atlas, navigate to the **Network Access** tab on your MongoDB Atlas console and click **Add IP Address**.
* Choose **Allow Access from Anywhere (`0.0.0.0/0`)** or whitelist Render's static outbound IPs if using a Render paid tier.

---

🎉 **Congratulations! Your full-stack PDF Extraction app is now live in production!**
