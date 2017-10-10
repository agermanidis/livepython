const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let win

function createWindow () {
  win = new BrowserWindow({
    x: 20, 
    y: 0, 
    width: 750, 
    height: 1000,
    icon: path.join(__dirname, 'livepython.png'),
    title: "livepython"
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true,
  }))


  ipcMain.on("command", (evt, msg) => {
    process.send(msg)
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
