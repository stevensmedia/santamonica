function initializeFS() {
	return new Promise((res, rej) => {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, res, rej)
	})
}

async function main() {
	try {
		await initializeFS()
	} catch(e) {
		console.log(e)
		alert("Unable to load filesystem. Things may fail to work.")
	}

	const q = (a) => document.querySelector(a)
	const qa = (a) => document.querySelectorAll(a)

	q("fluent-button[scan]").addEventListener("click", () => {
		const target = q("#music-path")
		const path = target.value
	})
}
document.addEventListener('deviceready', main, false);
