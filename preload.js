const electron = require('electron')

electron.contextBridge.exposeInMainWorld('SantaMonica', {
	chooseDirectory: () => {
		return electron.ipcRenderer.invoke('chooseDirectory')
	}
})
