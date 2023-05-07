const electron = require('electron')

electron.contextBridge.exposeInMainWorld('SantaMonica', {
	chooseDirectory: () => {
		return electron.ipcRenderer.invoke('chooseDirectory')
	},
	scanPath: (path) => {
		return electron.ipcRenderer.invoke('scanPath', path)
	},
	quit: () => {
		return electron.ipcRenderer.invoke('quit')
	},
	settings: {
		read: (domain, key) => {
			return JSON.parse(electron.ipcRenderer.invoke('settings.read', domain, key))
		},
		write: (domain, key, value) => {
			return electron.ipcRenderer.invoke('settings.write', domain, key, JSON.stringify(value))
		}
	}
})
