const fs = require('fs/promises')

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

module.exports = Settings
