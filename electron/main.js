const { app, BrowserWindow, session } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,           // removes OS titlebar — your custom one takes over
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    icon: path.join(__dirname, '../public/icon.ico'),
  })

  // Load built React app
  win.loadFile(path.join(__dirname, '../dist/index.html'))

  // Allow only arman.ahrtechdiv.com in any navigation
  win.webContents.on('will-navigate', (event, url) => {
    try {
      const host = new URL(url).hostname
      if (host !== 'arman.ahrtechdiv.com' && !url.startsWith('file://')) {
        event.preventDefault()
      }
    } catch { event.preventDefault() }
  })

  // Minimize / Maximize / Close via IPC (wire to your title bar buttons)
  const { ipcMain } = require('electron')
  ipcMain.on('win-minimize', () => win.minimize())
  ipcMain.on('win-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize())
  ipcMain.on('win-close',    () => win.close())
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
