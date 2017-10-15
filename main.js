const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let win
let varInspector;

function openVariableInspector () {
  varInspector = new BrowserWindow({
    x: 800,
    y: 0,
    width: 500,
    height: 800,
    title: "Variable Inspector"
  });

  varInspector.loadURL(url.format({
      pathname: path.join(__dirname, "dist", "variable_inspector.html"),
      protocol: "file:",
      slashes: true
    }));

  varInspector.on('close', () => {
    varInspector = null;
  })
}

function createWindow () {
  win = new BrowserWindow({
    x: 20,
    y: 0,
    width: 750,
    height: 1000,
    icon: path.join(__dirname, 'livepython.png'),
    title: "Livepython"
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true,
  }))

  ipcMain.on("command", (evt, msg) => {
    process.send(msg)
  })

  ipcMain.on("toggle_variable_inspector", (evt, msg) => {
    if (varInspector) {
      varInspector.close();
      varInspector = null;
    } else {
      openVariableInspector();
    }
  });

  process.on('message', message => {
    const parsed = JSON.parse(message)
    if (parsed.type === 'finish') {
      app.quit()
    }
    if (win) win.webContents.send('trace', { msg: message })
    if (varInspector) varInspector.webContents.send('trace', { msg: message });
  })

  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
