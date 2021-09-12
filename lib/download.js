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

function downloadTS(tsUrlList, finishList, durationSecond, fileName, tabid) {
	let isPause = false
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

	let conversionMp4 = (data, index, callback) => {
		let transmuxer = new muxjs.Transmuxer({
			keepOriginalTimestamps: true,
			duration: parseInt(durationSecond),
		});
		
		transmuxer.on('data', segment => {
			if (index === 0) {
				let data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
				data.set(segment.initSegment, 0);
				data.set(segment.data, segment.initSegment.byteLength);
				callback(data.buffer)
			} else {
				callback(segment.data)
			}
		})
		transmuxer.push(new Uint8Array(data));
		transmuxer.flush();
	}

	let dealTS = (file, index, callback) => {
		const data = file
		
		conversionMp4(data, index, (afterData) => {
			mediaFileList[index] = afterData
			finishList[index].status = 'finish'
			finishNum++
			const color = calculateColor(finishNum, tsUrlList.length)
			const value = calculateValue(finishNum, tsUrlList.length)
			chrome.tabs.sendMessage(tabid, {action: 'SET', id: `thuthi_progress_${fileName}`, value: value, color: color});
			chrome.runtime.sendMessage({action: 'PROGRESS', title: fileName, progress : calculateValue(finishNum, tsUrlList.length), color: color});
			if (finishNum === tsUrlList.length) {
				downloadFile(mediaFileList)
			}
			callback && callback()
		})
	}

	let download = () => {
		let isPauseCopy = isPause
		let index = downloadIndex
		downloadIndex++
		if (finishList[index] && finishList[index].status === '') {
			ajax({
				url: tsUrlList[index],
				type: 'file',
				success: (file) => {
					dealTS(file, index, () => index < tsUrlList.length && !isPauseCopy && download())
				},
				fail: () => {
					finishList[index].status = 'error'
					if (downloadIndex < tsUrlList.length) {
						!isPauseCopy && download()
					}
				}
			})
		} else if (downloadIndex < tsUrlList.length) {
			!isPauseCopy && download()
		}
	}

	for (let i = 0; i < 10; i++) {
		download(i)
	}
}

async function downloadVideo(url, fileName, tabid) {
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
			chrome.tabs.sendMessage(tabid, {action: 'SET', id: `thuthi_progress_${fileName}`, value: '0  %', color: "red"});
			chrome.runtime.sendMessage({action: 'PROGRESS', title: fileName, progress : '0  %', color: "#FF0000"});
			if (tsUrlList.length > 0) { 
				downloadTS(tsUrlList, finishList, durationSecond, fileName, tabid)
			} else {
				window.alert('에러코드 : 0x80808080')
			}
		}
	})
}