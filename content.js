
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

	let newDiv = document.createElement('div')

	activity.parentElement.insertBefore(newDiv, activity.parentElement.children[1])

	let newButton = document.createElement('input')
	newButton.setAttribute('type', 'button')
	newButton.setAttribute('value', '다운로드')
	newButton.setAttribute('style', 'margin-left: 3em;')
	newButton.onclick = () => {
		chrome.runtime.sendMessage({action: 'DOWNLOAD', url: videoUrl, title: lectureTitle + '_' + videoTitle, id : index});
	}
	newDiv.appendChild(newButton)

	let progressLabel = document.createElement('em')
	progressLabel.setAttribute('id', `thuthi_progress_${index}`)
	progressLabel.setAttribute('style', 'margin-left: 1em;')
	newDiv.appendChild(progressLabel)
}

function getVideoTitle(activity) {
	let temp = activity.getElementsByClassName('instancename')[0].textContent.split(' ')
	temp.pop()
	temp = temp.join(' ').split('.mp4')
	temp.pop()
	return temp.join('')
}

function getVideoUrl(activity) {
	return activity.children[0].href.replace('view', 'viewer')
}