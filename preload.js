const electron = require('electron')

electron.contextBridge.exposeInMainWorld('SantaMonica', {
	chooseDirectory: () => {
		return electron.ipcRenderer.invoke('chooseDirectory')
	},
	scanPath: (path) => {
		return electron.ipcRenderer.invoke('scanPath')
	},
	quit: () => {
		return electron.ipcRenderer.invoke('quit')
	}
})
