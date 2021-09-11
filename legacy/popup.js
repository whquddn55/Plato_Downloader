chrome.runtime.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.action === 'SET') {
			document.getElementById(request.id).innerText = request.value
		}
	});

function getCurrentLocation() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
			resolve(tabs[0].url)
		});
	})
}

function getTitle() {
	return new Promise((resolve, reject) => {
		chrome.tabs.executeScript({
			code: `document.getElementById('vod_header').children[2].innerHTML.split('<span')[0].trim()`
		}, result => {
			resolve(result)
		})
	})
}

function getVideoUrl() {
	return new Promise((resolve, reject) => {
		chrome.tabs.executeScript({
			code: `document.getElementById("my-video_html5_api").children[0].src`
		}, result => {
			resolve(result)
		})
	})
}

function disableDownload() {
	document.getElementById('download').disabled = true
	document.getElementById('fileName').innerText = '동영상이 감지되지 않습니다.'
	document.getElementById('lecture').onkeyup = null
}

async function enableDownload() {
	const title = await getTitle()
	const videoUrl = (await getVideoUrl())[0]

	document.getElementById('download').disabled = false
	document.getElementById('fileName').innerText = title
	document.getElementById('lecture').onkeyup = () => {
		let lecture = document.getElementById('lecture').value
		if (lecture !== '')
			lecture += '_'
		document.getElementById('fileName').innerText = lecture + title
	}
	document.getElementById('download').onclick = () => {
		chrome.runtime.sendMessage({action: 'DOWNLOAD', url: videoUrl, title: title});
	}
}

async function checkLocation() {
	let currentLocation = await getCurrentLocation()
	if (currentLocation.split('?')[0] != 'https://plato.pusan.ac.kr/mod/vod/viewer.php')
		disableDownload()
	else
		enableDownload()

	/* let ff = () => {
		ajax({
			url: 'https://plato.pusan.ac.kr/mod/vod/viewer.php?id=1082634',
			type: 'get',
			success: (file) => {
				console.error(file)
			},
			fail: () => {
				
			}
		})
	}
	document.getElementById('bb').onclick = ff */
}

async function main() {
	checkLocation()
}

main()