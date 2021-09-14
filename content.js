
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

let temp = document.getElementsByClassName('coursename')[0].title.split(' ')
temp.pop()
const lectureTitle = temp.join(' ')
const activities = document.getElementsByClassName('activityinstance')

for (let activity of activities) {
	if (activity.children[0] == undefined || 
		activity.children[0].tagName !== 'A' || 
		activity.children[0].children[0] == undefined ||
		activity.children[0].children[0].alt !== '동영상' ||
		activity.children[0].href == undefined)
		continue;

	const videoTitle = lectureTitle + '_' + getVideoTitle(activity)
	const videoUrl = getVideoUrl(activity)
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
	let id = Array.prototype.indexOf.call(activity.parentElement.children, activity)
	activity.parentElement.insertBefore(downloadButton, activity.parentElement.children[id + 1])
}

function getVideoTitle(activity) {
	let temp = activity.getElementsByClassName('instancename')[0].textContent
	let check = activity.getElementsByClassName('instancename')[0].getElementsByClassName('accesshide').length
	if (check) {
		temp = temp.split(' ')
		temp.pop()
		temp = temp.join(' ')
	}
	return temp.split('.mp4')[0].trim()
}

function getVideoUrl(activity) {
	return activity.children[0].href.replace('view', 'viewer')
}