const electron = require('electron')

async function main() {
	await electron.app.whenReady()

	const opts = {
		"autoHideMenuBar": true
	}

	const win = new electron.BrowserWindow(opts)

	win.loadFile("www/index.html")
}

main()
