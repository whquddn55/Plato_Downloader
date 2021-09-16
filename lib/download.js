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

function downloadTS(tsUrlList, finishList, durationSecond, fileName, className, tabid, m3u8url) {
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
		chrome.tabs.sendMessage(tabid, {action: 'SET', className: className, value: value, color: color});
		chrome.runtime.sendMessage({action: 'PROGRESS', title: fileName, progress : calculateValue(finishNum, tsUrlList.length), color: color});
		if (finishNum === tsUrlList.length) {
			downloadFile(mediaFileList)
			/* let totalLength = mediaFileList.reduce((len, ele) => len + ele.byteLength, 0)
			let result = new Uint8Array(totalLength)
			let sum = 0;
			for (let e of mediaFileList) {
				result.set(new Uint8Array(e), sum)
				sum += e.byteLength
			}

			let transmuxer = new muxjs.Transmuxer({
				keepOriginalTimestamps: true,
				duration: parseInt(durationSecond),
			});
			transmuxer.on('data', segment => {
				let data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
				data.set(segment.initSegment, 0);
				data.set(segment.data, segment.initSegment.byteLength);
				downloadFile([data.buffer])
			})
			transmuxer.push(result);
			transmuxer.flush(); */
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
						window.prompt('다운로드 실패! 아래 정보와 함께 개발자에게 연락 바랍니다.', `${index} : ${downloadIndex} : ${finishList[index].title} : ${m3u8url}`)
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

async function downloadVideo(url, fileName, className, tabid) {
	ajax({
		url: url,
		type:'get',
		success: (m3u8Str) => {
			let durationSecond = 0
			let tsUrlList = []
			let finishList = []
			m3u8Str.split('\n').forEach((item) => {
				if (item.toUpperCase().indexOf('#EXTINF:') > -1) {
				  durationSecond += parseFloat(item.split('#EXTINF:')[1])
				}
				if (item.toLowerCase().indexOf('.ts') > -1) {
					tsUrlList.push(applyURL(item, url))
					finishList.push({
						title: item,
						status: ''
					})
				}
			})
			chrome.tabs.sendMessage(tabid, {action: 'SET', className: className, value: '0  %', color: "red"});
			chrome.runtime.sendMessage({action: 'PROGRESS', title: fileName, progress : '0  %', color: "#FF0000"});
			if (tsUrlList.length > 0) { 
				downloadTS(tsUrlList, finishList, durationSecond, fileName, className, tabid, url)
			} else {
				window.alert('에러코드 : 0x80808080')
			}
		}
	})
}