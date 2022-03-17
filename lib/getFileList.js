async function getFileList(url, tab, content) {
	let fileList = []
	return new Promise(async (resolve, reject) => {
		if (url.indexOf('plato.pusan.ac.kr/course/view.php') != -1) {
			if ($(content).find('.btn-loginout').length == 0)
				return
			// 강의명
			let temp = $(content).find('.coursename')[0].textContent.split(' ')
			temp.pop()
			const lectureTitle = temp.join(' ')

			$(content).find('.activityinstance').each(async (index, element) => {
				if (element.children[0] == undefined ||
					element.children[0].tagName !== 'A' ||
					element.children[0].children[0] == undefined ||
					element.children[0].children[0].alt !== '동영상' ||
					element.children[0].href == undefined ||
					element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id != 'course-all-sections'
					) 
					return

				// 파일명
				temp = $(element).find('.instancename')[0].textContent
				if ($(element).find('.instancename').find('.accesshide').length) {
					temp = temp.split(' ')
					temp.pop()
					temp = temp.join(' ')
				}
				const videoTitle = temp.split('mp4')[0].trim()
				const videoUrl = element.children[0].href.replace('view', 'viewer')
				let videoWeekItem = element
				for (let i = 0; i < 7; ++i)
					videoWeekItem = videoWeekItem.parentElement
				const videoWeek = Number(videoWeekItem.id.split('-')[1])
				fileList.push({title: lectureTitle, subTitle: videoTitle, url: videoUrl, reserve: false, week: videoWeek})
			})

			let fileMap = new Map()
			let fileCnt = new Map()
			for (let file of fileList) {
				let mapValue = fileMap.get(file.subTitle) ? fileMap.get(file.subTitle) + 1 : 1
				fileMap.set(file.subTitle, mapValue)
				fileCnt.set(file.subTitle, 1)
			}
			
			for (let file of fileList) {
				if (fileMap.get(file.subTitle) > 1) {
					let prvSubTitle = file.subTitle
					file.subTitle += `_${file.week}주차`
					fileCnt.set(prvSubTitle, fileCnt.get(prvSubTitle) + 1)
				}
			}
			fileMap.clear()
			fileCnt.clear()

			for (let file of fileList) {
				let mapValue = fileMap.get(file.subTitle) ? fileMap.get(file.subTitle) + 1 : 1
				fileMap.set(file.subTitle, mapValue)
				fileCnt.set(file.subTitle, 1)
			}
			
			for (let file of fileList) {
				if (fileMap.get(file.subTitle) > 1) {
					let prvSubTitle = file.subTitle
					file.subTitle += `_${fileCnt.get(prvSubTitle)}`
					fileCnt.set(prvSubTitle, fileCnt.get(prvSubTitle) + 1)
				}
			}

			resolve(fileList)
		}
		else if (url.indexOf('plato.pusan.ac.kr/mod/vod/view.php') != -1) {
			if ($(content).find('.btn-loginout').length == 0)
				return
			let aTagList = Array.from($(content).find('.breadcrumb').find('a'))
			let temp
			for (let aTag of aTagList) {
				if (aTag.href.indexOf('course/view.php') != -1){
					temp = aTag
					break
				}
			}
			temp = temp.textContent.split(' ')
			temp.pop()
			const lectureTitle = temp.join(' ')

			for (let aTag of aTagList) {
				if (aTag.href.indexOf('mod/vod/view.php') != -1) {
					temp = aTag
					break
				}
			}
			const videoTitle = lectureTitle + '_' + temp.textContent.split('.mp4')[0].trim()
			const videoUrl = $(content).find('.buttons')[0].children[0].href
			fileList.push({title: lectureTitle, subTitle: videoTitle, url: videoUrl, reserve: false})
			
			resolve(fileList)
		}
		else {
			for (let e of requestList) {
				if (e['source'] && url.indexOf(e['source']) != -1) {
					await new Promise((resolve, reject) => {
						ajax({
							url: e['url'],
							type: 'GET',
							success: (res) => {
								let lineList = res.split('\n')
								let cnt = 0
								for (let i = 0; i < lineList.length; ++i) {
									line = lineList[i]
									if (line.indexOf('#EXT-X-STREAM-INF') == -1)
										continue
									
									const resolutionIndex = line.indexOf('RESOLUTION')
									const toIndex = line.indexOf(',', resolutionIndex) != -1 ? line.indexOf(',', resolutionIndex) : line.indexOf('\r', resolutionIndex)
									let resolution
									if (resolutionIndex != -1)
										resolution = line.substr(resolutionIndex + 11, toIndex - (resolutionIndex + 11))
									else {
										resolution = `undefined resoltion_${cnt}`
										++cnt
									}
									let url = e['url'].substr(0, e['url'].lastIndexOf('/', e['url'].indexOf('m3u8'))) + '/' + lineList[i + 1]
									++i
									fileList.push({title: tab.title, subTitle: resolution, url: url, reserve: true})
								}
								
								resolve()
							}
						})
					})
				}
				if (fileList.length) {
					requestList.splice(requestList.indexOf(e), 1)
					break
				}
			}
			resolve(fileList)
		}
	});
}