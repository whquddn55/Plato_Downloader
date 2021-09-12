
chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		if (request.action === 'PROGRESS') {
			disableLoader()
			setProgress(request.title, request.progress, request.color)
		}
	});

function disableLoader() {
	document.getElementById('loader').setAttribute('style', 'display:none;')
}

function createNewItemBox(title, progressValue, color) {
	let newItemBox = document.createElement('div')
	newItemBox.setAttribute('class', 'itemBox')
	newItemBox.setAttribute('id', title)
	newItemBox.style.setProperty('--progressBar-background', color)
	let newItemLeft = document.createElement('div')
	newItemLeft.setAttribute('class', 'item-left')
	let newTitle = document.createElement('div')
	newTitle.setAttribute('class', 'title')
	newTitle.innerText = title
	let newProgressBar = document.createElement('progress')
	newProgressBar.setAttribute('class', 'progressBar')
	newProgressBar.setAttribute('value', progressValue)
	newProgressBar.setAttribute('max', 100)
	let newItemRight = document.createElement('div')
	newItemRight.setAttribute('class', 'item-right')
	newItemRight.innerText = progressValue + '%'


	newItemBox.appendChild(newItemLeft)
	newItemBox.appendChild(newItemRight)
	newItemLeft.appendChild(newTitle)
	newItemLeft.appendChild(newProgressBar)
	return newItemBox
}

function setProgress(title, progress, color) {
	const target = document.getElementById(title)
	const progressValue = progress.indexOf('%') == -1 ? 100 : parseInt(progress.split('%')[0])
	if (target === null) {
		const children = document.getElementById('queue').children
		let idx = -1
		for (child of children) 
			if (child.id <= title) 
				++idx
		document.getElementById('queue').insertBefore(createNewItemBox(title, progressValue, color), children[idx + 1])
	}
	else{
		target.style.setProperty('--progressBar-background', color)
		target.getElementsByClassName('progressBar')[0].setAttribute('value', progressValue)
		target.getElementsByClassName('item-right')[0].innerText = progressValue + '%'
	}
}