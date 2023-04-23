async function main() {
	const q = (a) => document.querySelector(a)
	const qa = (a) => document.querySelectorAll(a)

	q("fluent-button[scan]").addEventListener("click", () => {
		const target = q("#music-path")
		const path = target.value
	})

	q("fluent-button[choose-music-path]").addEventListener("click", async () => {
		const dir = await SantaMonica.chooseDirectory()
		console.log("Chose directory", dir)
	})

}
document.addEventListener('DOMContentLoaded', main);
