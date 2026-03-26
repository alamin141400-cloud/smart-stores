# Smart Stores WMS

> A dedicated Windows Desktop Client for an Enterprise Warehouse Management System — built with React 19, Vite, and Electron.

---

## What is Smart Stores?

Smart Stores is a hardened desktop shell that wraps your WMS server (`arman.ahrtechdiv.com`) in a secure, enterprise-grade Windows application. It replaces a standard browser with a purpose-built client that enforces domain locking, manages credentials locally, and delivers a polished Windows 11–style experience.

---

## Features

### Windows Shell
- Custom frameless title bar with Minimize, Maximize, and Close controls
- Windows 11–inspired panel layout and navigation chrome
- Live clock and connection status in the bottom status bar

### Tabbed Browser
- Up to **10 tabs**, each with independent navigation history
- Back, Forward, Reload, and Home buttons with full history stacks
- **Domain-locked** — navigation is strictly restricted to `arman.ahrtechdiv.com`. Any attempt to load another domain is blocked immediately

### Verified Server Bar
- Read-only address bar — users cannot type arbitrary URLs
- Displays a **Verified Server** badge with green lock on every page
- Autofill indicator appears automatically when saved credentials match the current domain

### Password Manager
- Save prompts appear automatically on login/auth pages
- View, reveal, and delete saved credentials from the side panel
- All passwords stored locally in `localStorage` with AES-256 encryption simulation
- Credentials **never leave the device**

### Enterprise Theming
8 built-in color palettes, switchable live from the Settings panel:

| Theme | Accent |
|---|---|
| Deep Blue | `#3b82f6` |
| Midnight | `#8b5cf6` |
| Emerald | `#10b981` |
| Royal Purple | `#a855f7` |
| Crimson | `#ef4444` |
| Ocean | `#06b6d4` |
| Slate Light | `#3b82f6` |
| Amber Gold | `#f59e0b` |

### Zoom & Print
- Content zoom from **25% to 500%** via slider or step buttons
- Print page shortcut available from the nav bar

### OS Gate
- Detects non-Windows operating systems on launch and shows a full-screen warning
- Developer bypass button available for testing on macOS/Linux

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 5 |
| Desktop Shell | Electron 30 |
| Icons | lucide-react |
| Packaging | electron-builder |
| Installer format | NSIS (Windows x64) |

---

## Project Structure

```
smart-stores/
├── public/
│   └── icon.ico
├── src/
│   ├── main.jsx
│   └── SmartStores.jsx
├── electron/
│   └── main.js
├── index.html
├── vite.config.js
├── package.json
└── .github/
    └── workflows/
        └── build.yml
```

---

## Local Development

### Prerequisites

- Node.js 20 or later
- npm 9 or later

### Install

```bash
git clone https://github.com/your-username/smart-stores.git
cd smart-stores
npm install
```

### Run in browser (React only)

```bash
npm run dev
```

Opens at `http://localhost:5173`.

### Run as desktop app (Electron)

```bash
npm run build
npm run electron:dev
```

---

## Building the Windows .exe

### Option 1 — GitHub Actions (recommended, no local setup needed)

Push to the `main` branch. The workflow at `.github/workflows/build.yml` runs automatically on GitHub's `windows-latest` runner and produces a signed NSIS installer.

To download the built `.exe`:

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Open the latest **Build Smart Stores Windows EXE** run
4. Scroll to **Artifacts** at the bottom
5. Download `SmartStores-Windows-EXE`

### Option 2 — Build locally on Windows

```bash
npm run build        # compiles React via Vite → dist/
npm run dist         # packages with electron-builder → release/
```

The installer is written to `release/Smart Stores Setup 2.0.1.exe`.

---

## GitHub Actions Workflow

The workflow file at `.github/workflows/build.yml`:

```yaml
name: Build Smart Stores Windows EXE

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --win --x64
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: SmartStores-Windows-EXE
          path: release/*.exe
          retention-days: 30
```

No secrets or extra configuration needed — `GITHUB_TOKEN` is provided automatically by GitHub.

---

## Configuration

### Changing the target server

Open `src/SmartStores.jsx` and update the domain constant at the top of the file:

```js
const DOMAIN = "arman.ahrtechdiv.com";
```

Replace it with your server's hostname. All domain locking, address bar display, and password matching will update automatically.

### Changing the app name or version

Edit `package.json`:

```json
{
  "name": "smart-stores",
  "version": "2.0.1",
  "build": {
    "productName": "Smart Stores",
    "nsis": {
      "shortcutName": "Smart Stores WMS"
    }
  }
}
```

---

## Security Model

| Mechanism | Detail |
|---|---|
| Domain lock | `navigate()` parses every URL with `new URL()` and rejects any hostname that does not exactly match `DOMAIN` |
| Read-only address bar | The URL input field is replaced with a static display — users cannot type or paste alternate URLs |
| Electron navigation guard | `will-navigate` event in `electron/main.js` blocks any navigation outside the allowed domain at the OS level |
| Local-only credentials | Passwords are stored in `localStorage` on the device only and are never transmitted |
| No external network calls | The app makes no analytics, telemetry, or update check requests |

---

## Installer Details

The NSIS installer produced by electron-builder:

- Presents a standard Windows install wizard
- Lets the user choose the installation directory
- Creates a **Start Menu** shortcut under Smart Stores WMS
- Creates a **Desktop** shortcut
- Includes an Add/Remove Programs entry for clean uninstallation
- Targets **Windows x64** (Windows 10 and Windows 11)

---

## License

Proprietary — internal use only.  
© 2025 AHR Tech Division. All rights reserved.
