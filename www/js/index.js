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
		const songData = results.files.map(file => {
			return {
				title: file.data.title,
				album: file.data.album,
				track: file.data.track.no,
				filename: file.file
			}
		})
		q('#songsGrid').rowsData = songData

		const playlistData = results.playlists.map(file => {
			return {
				filename: file.file
			}
		})
		q('#playlistsGrid').rowsData = playlistData
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
