const electron = require('electron')
const fs = require('fs/promises')
const m3u8Parser = require('m3u8-parser')
const path = require('path')
const pouchdb = require('pouchdb')
const pouchdbfind = require('pouchdb-find')
const pouchdbutils = require('pouchdb-utils')
const process = require('process')

async function main() {
	await electron.app.whenReady()
	
	pouchdb.plugin(pouchdbfind)

	const settingsPath = path.join(electron.app.getPath('userData'), 'settings')
	console.log("[main] settingsPath", settingsPath)
	const settings = new pouchdb(settingsPath)

	const createWindow = async () => {
		var opts = {}
		try {
			const res = await settings.find({
				selector: { domain: 'app', setting: 'window' }
			})
			opts = res.docs[0].opts
		} catch(e) {
			// Don't care
		}

		const def = (name, value) => {
			if(!opts.hasOwnProperty(name)) {
				opts[name] = value
			}
		}

		def('width', 540)
		def('height', 960)

		opts.autoHideMenuBar = true
		opts.webPreferences = {
			preload: path.join(__dirname, 'preload.js')
		}

		const win = new electron.BrowserWindow(opts)

		win.loadFile("www/index.html")

		const saveDimensions = async (e) => {
			const [ x, y ] = win.getPosition()
			const [ w, h ] = win.getSize()

			const doc = await (async () => {
				var u = false
				try {
					const res = await settings.find({
						selector: { domain: 'app', setting: 'window' }
					})
					u = res.docs[0]
				} catch(e) {
				}
				if(!u) {
					u = {
						_id: pouchdbutils.uuid()
					}
				}
				return u
			})()

			doc.domain = 'app'
			doc.setting = 'window'
			doc.opts = {
				x,
				y,
				w,
				h
			}

			await settings.put(doc)
		}
		win.on('resized', saveDimensions)
		win.on('moved', saveDimensions)
	}

	await createWindow()

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

	electron.app.on('will-quit', async () => {
		await settings.compact()
		await settings.close()
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
			} catch(e) {
				console.error("Error reading playlist", playlist.file, e)
				ret.playlists = ret.playlists.filter((x) => x.file != playlist.file)
			}
			playlist.file = path.relative(target, playlist.file)
		}

		const musicMetadata = await import('music-metadata')
		for(const track of ret.files) {
			try {
				const data = await musicMetadata.parseFile(track.file)
				track.data = data.common
			} catch(e) {
				console.error("Error reading track", track.file, e)
				ret.files = ret.files.filter((x) => x.file != track.file)
			}
			track.file = path.relative(target, track.file)
		}

		return ret
	})
}

main()
