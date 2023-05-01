const electron = require('electron')
const fs = require('fs/promises')
const m3u8Parser = require('m3u8-parser')
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

	electron.ipcMain.handle('scanPath', async (ev, target) => {
		var ret = {
			playlists: [],
			files: []
		}

		var read

		read = async (t) => {
			try {
				const targetData = await fs.readdir(t)
				for(const f of targetData) {
					const file = path.join(t, f)
					const stats = await fs.stat(file)
					if(stats.isDirectory()) {
						console.log("Directory", file)
						await read(file)
					} else {
						if(file.match(/\.m3u8?$/)) {
							ret.playlists.push({ file })
						} else {
							ret.files.push({ file })
						}
					}
				}
			} catch(e) {
				console.error("Error reading path", target, e)
			}
		}

		await read(target)

		for(const playlist of ret.playlists) {
			try {
				const data = await fs.readFile(playlist.file)
				const parser = new m3u8Parser.Parser()
				parser.push(data.toString("UTF-8"))
				parser.end()

				playlist.manifest = parser.manifest
				console.log(`Playlist ${playlist.file} of length ${playlist.manifest.segments.length}`)
			} catch(e) {
				console.error("Error reading playlist", playlist.file, e)
				ret.playlists = ret.playlists.filter((x) => x.file != playlist.file)
			}
		}

		const musicMetadata = await import('music-metadata')
		for(const track of ret.files) {
			try {
				const data = await musicMetadata.parseFile(track.file)
				track.data = data.common
				console.log(track.data.album, track.data.track.no, track.data.title)
			} catch(e) {
				console.error("Error reading track", track.file, e)
				ret.files = ret.files.filter((x) => x.file != track.file)
			}
		}

		return ret
	})
}

main()
