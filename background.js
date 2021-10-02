let requestList = []
let progressMap = {}
let fileObj = {}

chrome.storage.local.get(['progressMap'], (result) => {
	progressMap = result.progressMap || {}
})

chrome.webRequest.onBeforeRequest.addListener(
	async (details) => {
		if (details['initiator'] && details['initiator'].indexOf('chrome-extension://') != -1)
			return
		if (requestList.length >= 1000)
			requestList.splice(0, 500)
		if (details['url'] && (details['url'].indexOf('m3u8') != -1)) {
			let token = details['url'].substr(0, details['url'].indexOf('m3u8'))
			for (let e of requestList)
				if (e['token'] == token)
					return
			requestList.push({url : details['url'], source: details['initiator'], token: token})
		}
	},
	{urls: ["<all_urls>"]}, []
);

chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		if (request.action === 'DOWNLOAD') {
			downloadVideo(request.url, request.title)
		}
		else if (request.action === 'FILELIST') {
			sendResponse({fileList: fileObj[request.tabId]})
		}
		else if (request.action === 'PROGRESS') {
			sendResponse({progressMap})
		} 
		else if (request.action === 'DELETE') {
			delete progressMap[request.target]
			chrome.storage.local.set({progressMap})
			sendResponse({result: true})
		}
	});

// tab url 변경 시
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	// 초기화
	if (changeInfo.status == 'loading') {
		chrome.browserAction.setBadgeText({text: '0'})
		delete fileObj[tabId]
	}
	if (changeInfo.status == 'complete' && tab.url) {
		let fileList = await getFileList(tab.url, tab)
		fileObj[tabId] = fileList
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			if (tabs && tabs[0].id == tabId)
				chrome.browserAction.setBadgeText({text: String(fileObj[tabId].length)})
		})
	}
})

// tab change 시
chrome.tabs.onActivated.addListener(function(activeInfo) {
	// icon badge추가
	chrome.browserAction.setBadgeText({text: String(fileObj[activeInfo.tabId] ? fileObj[activeInfo.tabId].length : 0)})

});
 
function downloadTS(tsUrlList, finishList, fileName, tsUrl) {
	let downloadIndex = 0
	let mediaFileList = []
	let finishNum = 0

	let calculateColor = (f, e) => {
		const hue = (f / e * 120).toString(10);
		return ["hsl(", hue, ",80%,50%)"].join("");
	}

	let calculateValue = (f, e) => {
		if (f == e) 
			return '완료!'
		let value = parseInt((f / e) * 100)
		let res = value
		let cnt = 3
		while (value) {
			value = parseInt(value / 10)
			--cnt
		}
		while (cnt--) {
			res += ' '
		}
		return res + '%'
	}

	let downloadFile = (fileDataList) => {
		let fileBlob = null
		let a = document.createElement('a')
		fileBlob = new Blob(fileDataList, { type: 'video/mp4' })
		a.download = fileName + '.mp4'
		a.href = URL.createObjectURL(fileBlob)
		a.style.display = 'none'
		document.body.appendChild(a)
		a.click()
		a.remove()
	}
	
	let dealTS = (file, index, callback) => {
		mediaFileList[index] = file
		finishList[index].status = 'finish'
		finishNum++
		const color = calculateColor(finishNum, tsUrlList.length)
		const value = calculateValue(finishNum, tsUrlList.length)
		progressMap[fileName] = {
			progress: value, color
		}

		if (value == '완료!') {
			chrome.storage.local.set({progressMap})
		}

		if (finishNum === tsUrlList.length) {
			downloadFile(mediaFileList)
		}
		callback()
	}

	let forceStop = false
	let download = (index, depth) => {
		if (forceStop)
			return
		if (index == undefined){
			index = downloadIndex
			downloadIndex++
		} 
		depth = depth || 1
		if (finishList[index] && finishList[index].status === '') {
			ajax({
				url: tsUrlList[index],
				type: 'file',
				success: (file) => {
					if (forceStop)
						return
					dealTS(file, index, () => index < tsUrlList.length && download())
				},
				fail: () => {
					if (forceStop)
						return
					if (depth == 10) {
						window.prompt('다운로드 실패! 아래 정보와 함께 개발자에게 연락 바랍니다.', `${index} : ${downloadIndex} : ${finishList[index].title} : ${tsUrl}`)
						forceStop = true
					} else {
						download(index, depth + 1)
					}
				}
			})
		} 
		else if (downloadIndex < tsUrlList.length) {
			console.log('Unexpected Error')
			console.log(downloadIndex, tsUrlList.length)
			console.log(index, finishList[index].status)
		}
	}

	for (let i = 0; i < 10; i++) {
		download()
	}
}

async function downloadVideo(url, fileName) {

	function applyURL(targetURL, baseURL) {
		baseURL = baseURL || location.href
		if (targetURL.indexOf('http') === 0) {
			  return targetURL
		} else if (targetURL[0] === '/') {
			  let domain = baseURL.split('/')
			  return domain[0] + '//' + domain[2] + targetURL
		} else {
			  let domain = baseURL.split('/')
			  domain.pop()
			  return domain.join('/') + '/' + targetURL
		}
	}

	ajax({
		url: url,
		type:'get',
		success: (m3u8Str) => {
			let tsUrlList = []
			let finishList = []
			m3u8Str.split('\n').forEach((item) => {
				if (item.toLowerCase().indexOf('.ts') > -1) {
					tsUrlList.push(applyURL(item, url))
					finishList.push({
						title: item,
						status: ''
					})
				}
			})
			if (tsUrlList.length > 0) { 
				progressMap[fileName] = {
					progress : '0  %', color: '#FF0000'
				}
				chrome.runtime.sendMessage({action: 'PROGRESS', title: fileName, progress : '0  %', color: "#FF0000"});
				downloadTS(tsUrlList, finishList, fileName, url)
			} else {
				window.alert('에러코드 : 0x80808080')
			}
		}
	})
}
