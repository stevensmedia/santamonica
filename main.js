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

	const getSetting = async (domain, setting, def = {}) => {
		var u = false
		try {
			const res = await settings.find({
				selector: { domain, setting }
			})
			u = res.docs[0]
		} catch(e) {
		}
		if(!u) {
			console.log(`[getSetting] setting ${domain}:${setting} not found`)
			u = {
				_id: pouchdbutils.uuid()
			}
		}
		console.log('[getSetting]', domain, setting, u)
		return { ...u, ...def }
	}

	const putSetting = async (domain, setting, data) => {
		const doc = await getSetting(domain, setting, {})
		const ret = { ...doc, ...data }
		console.log('[putSetting]', domain, setting, ret)
		await settings.put(ret)
	}

	const createWindow = async () => {
		const res = await getSetting('app', 'window', {
			width: 540,
			height: 960
		})
		const overlay = {
			autoHideMenuBar: true,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js')
			}
		}
		const opts = { ...res, ...overlay}
		console.log("[createWindow] opts", opts)
		const win = new electron.BrowserWindow(opts)

		win.loadFile("www/index.html")

		const saveDimensions = async (e) => {
			console.log("[saveDimensions] e", e)
			const [ x, y ] = win.getPosition()
			const [ width, height ] = win.getSize()

			data = {
				x,
				y,
				width,
				height
			}

			await putSetting('app', 'window', data)
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

	electron.app.on('before-quit', async () => {
		console.log("[before-quit] Compacting and closing database")
		try {
			await settings.compact()
			await settings.close()
			console.log("[before-quit] Closed database")
		} catch(e) {
			console.log("[before-quit] Failed to close database", e)
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

	electron.ipcMain.handle('settings.read', async (ev, domain, key) => {
		console.log("[settings.read], domain, key")

			doc.domain = 'app'
			doc.setting = 'window'
			doc.opts = {
				x,
				y,
				w,
				h
			}

			await settings.put(doc)


	})
}

main()
