async function main() {
	const q = (a) => document.querySelector(a)
	const qa = (a) => document.querySelectorAll(a)

	const scan = async () => {
		const target = q("#music-path")
		const path = target.value.trim()
		if(!path) {
			console.log("[scan] No path; aborting")
			return
		}
		const results = await SantaMonica.scanPath(path)
		console.log(results)
	}

	q("fluent-button[scan]").addEventListener("click", scan)

	q("fluent-button[choose-music-path]").addEventListener("click", async () => {
		const dir = await SantaMonica.chooseDirectory()
		console.log("Chose directory", dir)
		if(dir) {
			q("#music-path").value = dir
			scan()
		}
	})

}
document.addEventListener('DOMContentLoaded', main);
