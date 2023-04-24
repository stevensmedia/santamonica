const electron = require('electron')
const path = require('path')
const process = require('process')

function createWindow() {
	const opts = {
		autoHideMenuBar: true,
		width: 540,
		height: 960,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	}

	const win = new electron.BrowserWindow(opts)

	win.loadFile("www/index.html")
}

async function main() {
	await electron.app.whenReady()

	createWindow()

	electron.app.on('activate', function() {
		if(!electron.BrowserWindow.getAllWindows().length) {
			createWindow()
		}
	})

	electron.app.on('window-all-closed', function() {
		if(process.platform != 'darwin') {
			electron.app.quit()
		}
	})

	electron.ipcMain.handle('chooseDirectory', async (event) => {
		const ret = await electron.dialog.showOpenDialog({
			properties: [
				'openDirectory'
			]
		})
		if(ret.canceled) {
			return false
		} else {
			return ret.filePaths[0]
		}
	})

	electron.ipcMain.handle('scanPath', async (path) => {
	})
}

main()
