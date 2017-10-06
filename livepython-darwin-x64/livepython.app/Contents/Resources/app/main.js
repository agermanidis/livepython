const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let win

function createWindow () {
  win = new BrowserWindow({width: 750, height: 1000})

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    title: "livepython",
    frame: false,
    slashes: true,
    icon: path.join(__dirname, 'livepython.png')
  }))


  ipcMain.on("connected", () => {
    process.send("connected")
  })

  process.on('message', message => {
    const parsed = JSON.parse(message)
    if (parsed.type === 'finish') {
      app.quit()
    }
    if (win) win.webContents.send('trace', { msg: message })
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
