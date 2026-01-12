# Chitragupta OS (v1.0) 🧠

**Enterprise AI Operating System for Autonomous Business Management.**

## 🏗️ Architecture

```mermaid
graph TD
    User([User]) -->|Auth| Face[Apps/Web (Next.js)]
    Face -->|Triggers| Brain[Packages/Functions (Genkit)]
    Brain -->|Reads/Writes| Memory[(Firestore & Vector DB)]
    Brain -->|Connects| Ext[External APIs (WhatsApp, Instagram, IndiaMART)]
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Firebase CLI (`npm i -g firebase-tools`)
- GitHub CLI (`winget install GitHub.cli`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/sanjayhegde1-jpg/chitragupta-os.git
cd chitragupta-os

# Install dependencies
npm ci
```

### 3. Local Development (Emulators)
```bash
# Start Next.js frontend and Firebase Emulators
npm run dev
```
Visit `http://localhost:3000` to access the Command Center.

### 4. Autonomous QA
```bash
# Run the Playwright audit suite (Mock Auth Mode)
npx playwright test
```

## 🚢 Deployment

**Zero-Touch Deployment via GitHub Actions:**
1. Commit changes to `main` branch.
2. The CI pipeline (`.github/workflows/ci.yml`) automatically:
   - Builds the Monorepo.
   - Deploys Cloud Functions (`packages/functions`).
   - Deploys Hosting (`apps/web`).

**Manual Fallback:**
```bash
firebase deploy --only functions,hosting,firestore
```

## 🛡️ Security
- **Authentication**: Firebase Google Auth.
- **Secrets**: Google Cloud Secret Manager.
- **Rules**: Firestore Security Rules protect `system_config` and `memories`.
