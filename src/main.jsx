// ================= 2️⃣ main.js =================
const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");

const DOMAIN = "https://arman.ahrtechdiv.com";

let win;
let views = [];
let activeIndex = 0;

function createView(url = DOMAIN) {
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  view.webContents.loadURL(url);
  views.push(view);
  setActiveView(views.length - 1);
}

function setActiveView(index) {
  if (!views[index]) return;

  activeIndex = index;
  win.setBrowserView(views[index]);

  const bounds = win.getContentBounds();
  views[index].setBounds({ x: 0, y: 100, width: bounds.width, height: bounds.height - 100 });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      preload: __dirname + "/preload.js"
    }
  });

  win.loadFile("index.html");

  createView();

  win.on("resize", () => setActiveView(activeIndex));
}

app.whenReady().then(createWindow);

// IPC
ipcMain.handle("nav:back", () => {
  const v = views[activeIndex];
  if (v.webContents.canGoBack()) v.webContents.goBack();
});

ipcMain.handle("nav:forward", () => {
  const v = views[activeIndex];
  if (v.webContents.canGoForward()) v.webContents.goForward();
});

ipcMain.handle("nav:reload", () => {
  views[activeIndex].webContents.reload();
});

ipcMain.handle("tab:new", () => createView());
ipcMain.handle("tab:switch", (_, i) => setActiveView(i));

// ================= 3️⃣ preload.js =================
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  back: () => ipcRenderer.invoke("nav:back"),
  forward: () => ipcRenderer.invoke("nav:forward"),
  reload: () => ipcRenderer.invoke("nav:reload"),
  newTab: () => ipcRenderer.invoke("tab:new"),
  switchTab: (i) => ipcRenderer.invoke("tab:switch", i)
});
