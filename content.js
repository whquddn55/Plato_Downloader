
chrome.extension.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.action === 'SET') {
			
			if (document.getElementById(request.id) != undefined) {
				document.getElementById(request.id).innerText = request.value
				document.getElementById(request.id).style.color = request.color
			}
		}
	});

let temp = document.getElementsByClassName('coursename')[0].title.split(' ')
temp.pop()
const lectureTitle = temp.join('')
const activities = document.getElementsByClassName('activityinstance')

let idx = -1
for (let activity of activities) {
	const index = ++idx
	if (activity.children[0] == undefined || 
		activity.children[0].tagName !== 'A' || 
		activity.children[0].children[0] == undefined ||
		activity.children[0].children[0].alt !== '동영상' ||
		activity.children[0].href == undefined)
		continue;

	const videoTitle = getVideoTitle(activity)
	const videoUrl = getVideoUrl(activity)

	let downloadButton = document.createElement('div')
	downloadButton.setAttribute('type', 'button')
	downloadButton.innerText = '다운로드'
	downloadButton.setAttribute('id', `thuthi_progress_${index}`)
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
		chrome.runtime.sendMessage({action: 'DOWNLOAD', url: videoUrl, title: lectureTitle + '_' + videoTitle, id : index});
	}
	let id = Array.prototype.indexOf.call(activity.parentElement.children, activity)
	activity.parentElement.insertBefore(downloadButton, activity.parentElement.children[id + 1])
}

function getVideoTitle(activity) {
	let temp = activity.getElementsByClassName('instancename')[0].textContent.split(' ')
	temp.pop()
	return temp.join(' ').split('.mp4')[0].trim()
}

function getVideoUrl(activity) {
	return activity.children[0].href.replace('view', 'viewer')
}