
chrome.extension.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.action === 'SET') {
			const targetList = document.getElementsByClassName(request.className)
			for (const target of targetList) {
				target.onclick = null
				target.style.cursor = 'default'
				target.innerText = request.value
				target.style.color = request.color
			}
		}
	});

let aTagList = document.getElementsByClassName('breadcrumb')[0].getElementsByTagName('a')
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
const videoUrl = document.getElementsByClassName('buttons')[0].children[0].href
const className = `${videoTitle}_download_btn`

let downloadButton = document.createElement('div')
downloadButton.setAttribute('type', 'button')
downloadButton.innerText = '다운로드'
downloadButton.setAttribute('class', className)
downloadButton.setAttribute('style', `
	margin-left: 38px;
	width:70px;
	height: 30px;
	text-align: center;
	line-height: 30px;
	
	background: #005BAA;
	border-radius: 15px;
	text-transform: uppercase;
	font-family: 'Open Sans';
	font-size: 13px;
	color: white;
	position: relative;
	cursor: pointer;
`)


downloadButton.onclick = () => {
	chrome.runtime.sendMessage({action: 'DOWNLOAD', url: videoUrl, title: videoTitle, className : className});
}

document.getElementsByClassName('buttons')[0].setAttribute('style', 'display:flex;')
document.getElementsByClassName('buttons')[0].appendChild(downloadButton)


