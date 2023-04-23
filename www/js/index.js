async function main() {
	const q = (a) => document.querySelector(a)
	const qa = (a) => document.querySelectorAll(a)

	q("fluent-button[scan]").addEventListener("click", () => {
		const target = q("#music-path")
		const path = target.value
	})
}
document.addEventListener('DOMContentLoaded', main);
