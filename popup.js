let reverseStatus = 0
let hideStatus = 0

function ajax(options) {
	options = options || {};
	let xhr = new XMLHttpRequest();
	if (options.type === 'file') {
		xhr.responseType = 'arraybuffer';
	}

	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
		let status = xhr.status;
		if (status >= 200 && status < 300) {
			options.success && options.success(xhr.response);
		} else {
			options.fail && options.fail(status);
		}
		}
	};

	xhr.open("GET", options.url, true);
	xhr.send(null);
}

async function downloadButtonClickEvent(downloadButton, url, title, subTitle) {
	downloadButton.style.pointerEvents = 'none';
	chrome.runtime.sendMessage({action: 'DOWNLOAD', url: url, title: title + '_' + subTitle});
}

function appendFileItem(param) {
	const title = param.title ? param.title : ''
	const subTitle = param.subTitle ? param.subTitle : ''
	const url = param.url ? param.url : ''
	const reserve = param.reserve ? param.reserve : false

	let fileListItem = document.createElement('div')
	fileListItem.className = 'item'

	let titleItem = document.createElement('div')
	titleItem.textContent = title
	titleItem.className = 'itemTitle'

	let subTitleItem = document.createElement('div')
	subTitleItem.textContent = subTitle
	subTitleItem.className = 'itemSubTitle'

	let downloadButton = document.createElement('div')
	downloadButton.setAttribute('type', 'button')
	downloadButton.innerText = '다운로드'
	downloadButton.setAttribute('id', title + '_' + subTitle)
	downloadButton.setAttribute('class', 'downloadButton')
	downloadButton.onclick = async () => downloadButtonClickEvent(downloadButton, reserve? url : await getm3u8(url), title, subTitle)
	
	fileListItem.appendChild(downloadButton)
	fileListItem.appendChild(titleItem)
	fileListItem.appendChild(subTitleItem)

	let targetOfList = document.getElementById('fileList')
	targetOfList.appendChild(fileListItem)
}

async function requestFileList() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({active:true, currentWindow: true}, (tabs) => {
			chrome.runtime.sendMessage({action: 'FILELIST', tabId: tabs[0].id}, (res) => {
				if (res.fileList && res.fileList.length) {
					for (let e of res.fileList)
						appendFileItem(e)
				} else {
					let emptyMessage = document.createElement('div')
					emptyMessage.setAttribute('style', 'font-size: 14px; text-align: center; border-top: 1px solid #CCC; margin: 4px 0px; padding: 2px 5px;')
					emptyMessage.innerText = '동영상을 찾을 수 없습니다.'
					document.getElementById('fileList').appendChild(emptyMessage)
				}
				resolve()
			})
		})
		
	})
	
}

function getm3u8(videoUrl) {
	return new Promise((resolve, reject) => {
		ajax({
			url: videoUrl,
			type:'get',
			success: (content) => {
				const arr = content.split('\n')
				for (e of arr) {
					if (e.indexOf('m3u8') != -1) {
						resolve(e.split('"')[1])
					}
				}
			}
		})
	})
}

function intervalRun() {
	chrome.runtime.sendMessage({action: 'PROGRESS'}, (res) => {
		for (let key in res['progressMap']) 
			setProgress(key, res['progressMap'][key]['progress'], res['progressMap'][key]['color'])
		
		for (let e of document.getElementsByClassName('downloadButton')) {
			if (res['progressMap'][e.id]) {
				e.innerText = res['progressMap'][e.id]['progress']
				e.style.color = res['progressMap'][e.id]['color']

				if (res['progressMap'][e.id]['progress'] == '완료!') {
					e.style.pointerEvents = '';
					e.parentElement.classList.add('progress-complete')
					e.parentElement.style.display = hideStatus ? 'none' : ''
				}
			} else {
				e.innerText = '다운로드'
				e.style.color = '#FFF'
				e.style.pointerEvents = '';
				e.parentElement.classList.remove('progress-complete')
				e.parentElement.style.display = ''
			}
		}
	})
}

function timer() {
	intervalRun()
	setInterval(() => {
		intervalRun()
	}, 500);
}

function reverseList(item){
	let newItem = item.cloneNode(false)
	let list = []
	for (let i = item.children.length - 1; i >= 0; --i) {
		list.push(item.children[i])
	}
	for (let e of list)
		newItem.appendChild(e)
	item.parentNode.replaceChild(newItem, item)
}

function setProgress(title, progress, color) {
	const target = document.getElementById(title + '_progress')
	const progressValue = progress.indexOf('%') == -1 ? 100 : parseInt(progress.split('%')[0])
	if (target == null) {
		const children = document.getElementById('queue').children
		let idx = -1
		for (child of children) 
			if (child.id <= title) 
				++idx
		document.getElementById('queue').insertBefore(createNewProgressBox(title, progressValue, color), children[idx + 1])
	}
	else{
		target.style.setProperty('--progressBar-background', color)
		target.getElementsByClassName('progressBar')[0].setAttribute('value', progressValue)
		target.getElementsByClassName('progressItem-right')[0].innerText = progressValue + '%'
		if (progressValue == 100) {
			target.classList.add('progress-complete')
			target.style.display = hideStatus ? 'none' : ''
		}
	}
}

function createNewProgressBox(title, progressValue, color) {
	let newItemBox = document.createElement('div')
	newItemBox.setAttribute('class', 'progressBox')
	newItemBox.setAttribute('id', title + '_progress')
	newItemBox.setAttribute('title', '목록에서 삭제하기')
	newItemBox.style.setProperty('--progressBar-background', color)
	let newItemLeft = document.createElement('div')
	newItemLeft.setAttribute('class', 'progressItem-left')
	let newTitle = document.createElement('div')
	newTitle.setAttribute('class', 'progressItem-title')
	newTitle.innerText = title
	let newProgressBar = document.createElement('progress')
	newProgressBar.setAttribute('class', 'progressBar')
	newProgressBar.setAttribute('value', progressValue)
	newProgressBar.setAttribute('max', 100)
	let newItemRight = document.createElement('div')
	newItemRight.setAttribute('class', 'progressItem-right')
	newItemRight.innerText = progressValue + '%'

	if (progressValue == 100) {
		newItemBox.classList.add('progress-complete')
		newItemBox.style.display = hideStatus ? 'none' : ''
	}

	newItemBox.onclick = (event) => {
		event.preventDefault()
		if (newProgressBar.getAttribute('value') == 100 && confirm(`${title}을\n목록에서 삭제합니다.`))
			chrome.runtime.sendMessage({action: 'DELETE', target: title}, (res) => {
				document.getElementById('queue').innerHTML = ''
				intervalRun()
			})
	}
	
	newItemBox.appendChild(newItemLeft)
	newItemBox.appendChild(newItemRight)
	newItemLeft.appendChild(newTitle)
	newItemLeft.appendChild(newProgressBar)
	return newItemBox
}

function switchToFileList() {
	document.getElementsByClassName('tabItem')[0].classList.add('selected')
	document.getElementsByClassName('tabItem')[1].classList.remove('selected')
	document.getElementById('queue').style.display = 'none'
	document.getElementById('reverseItem').style.display = ''
	document.getElementById('fileList').style.display = ''
}

function switchToDownloadStatus() {
	document.getElementsByClassName('tabItem')[1].classList.add('selected')
	document.getElementsByClassName('tabItem')[0].classList.remove('selected')
	document.getElementById('fileList').style.display = 'none'
	document.getElementById('reverseItem').style.display = 'none'
	document.getElementById('queue').style.display = ''
}

async function main() {
	// 우클릭 방지
	document.oncontextmenu = (event) => event.preventDefault()

	chrome.storage.local.get(['reverseStatus', 'hideStatus'], (result) => {
		reverseStatus = result.reverseStatus || 0
		hideStatus = result.hideStatus || 0
		document.getElementById('hide').setAttribute('src', hideStatus ? 'assets/hided.png' : 'assets/hide.png')
	})

	await requestFileList()
	timer()

	if (reverseStatus) 
		reverseList(document.getElementById('fileList'))

	document.getElementById('reverseItem').onclick = () => {
		reverseStatus = !reverseStatus
		chrome.storage.local.set({reverseStatus})
		reverseList(document.getElementById('fileList'))
	}
	document.getElementsByClassName('tabItem')[0].onclick = () => switchToFileList()
	document.getElementsByClassName('tabItem')[1].onclick = () => switchToDownloadStatus()

	document.getElementById('hide').onclick = () => {
		hideStatus = !hideStatus
		chrome.storage.local.set({hideStatus})
		for (let e of document.getElementsByClassName('progress-complete')) 
			e.style.display = hideStatus ? 'none' : ''
		document.getElementById('hide').setAttribute('src', hideStatus ? 'assets/hided.png' : 'assets/hide.png')
	}
	switchToFileList()
}

main()
