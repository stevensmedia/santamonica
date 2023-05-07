const electron = require('electron')
const fs = require('fs/promises')
const m3u8Parser = require('m3u8-parser')
const path = require('path')
const process = require('process')

const Settings = function() {
	const ths = {
		data: [],
		get: async function(domain, setting, def = {}) {
			var u = await this.data.find((e) => {
				const res = e.domain == domain && e.setting == setting
				return res
			})
			if(!u) {
				u = {
					domain,
					setting
				}
				u = { ...def, ...u }
				this.data.push(u)
			}
			return u
		},
		put: async function(domain, setting, data) {
			const doc = await this.get(domain, setting, {})
			const overlay = {
				domain,
				setting
			}
			this.data = this.data.filter(e => (e.domain != domain || e.setting != setting))
			const newdoc = { ...doc, ...data, ...overlay }
			this.data.push(newdoc)
		},
		load: async function(path) {
			try {
				const saved = await fs.readFile(path)
				this.data = JSON.parse(saved)
			} catch(e) {
				console.log("[Settings.load] No settings file found!", e)
			}
		},
		save: async function(path) {
			try {
				await fs.writeFile(path, JSON.stringify(this.data))
			} catch(e) {
				console.log("[Settings.save] Could not write settings", e)
			}
		}
	}
	return ths
}

async function main() {
	await electron.app.whenReady()
	
	const settingsPath = path.join(electron.app.getPath('userData'), 'settings.json')
	const settings = Settings()
	console.log("[main] Loading settings from", settingsPath)
	await settings.load(settingsPath)

	const createWindow = async () => {
		const res = await settings.get('app', 'window', {
			width: 540,
			height: 960
		})
		const overlay = {
			autoHideMenuBar: true,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js')
			}
		}
		const saveDimensions = async (e) => {
			const [ x, y ] = win.getPosition()
			const [ width, height ] = win.getSize()

			data = {
				x,
				y,
				width,
				height
			}

			await settings.put('app', 'window', data)
		}
		const opts = { ...res, ...overlay}
		const win = new electron.BrowserWindow(opts)
		saveDimensions({})

		win.loadFile("www/index.html")

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
		console.log("[before-quit] Saving database")
		await settings.save(settingsPath)
		console.log("[before-quit] Database saved")
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
