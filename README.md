# PureBG - AI Background Remover

Professional-grade background removal powered by AI. Fast, secure, and runs entirely in your browser.

## 🚀 Deployment to Netlify

This project is optimized for Netlify deployment.

### 1. Connect to Netlify
- Push this code to a GitHub/GitLab/Bitbucket repository.
- Log in to [Netlify](https://www.netlify.com/).
- Click **"Add new site"** > **"Import an existing project"**.
- Select your repository.

### 2. Configure Build Settings
Netlify should automatically detect the settings from `netlify.toml`, but here they are for reference:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### 3. Environment Variables
If you use any external APIs (like Gemini), add them in the Netlify UI:
- Go to **Site Settings** > **Environment variables**.
- Add `GEMINI_API_KEY` (if needed for additional features).

### 4. Important Headers
The `netlify.toml` file includes specific headers required for high-performance WASM:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These headers enable `SharedArrayBuffer`, which significantly speeds up the AI background removal process.

## 🛠️ Local Development
```bash
npm install
npm run dev
```
