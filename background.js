
chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		if (request.action === 'DOWNLOAD') {
			const url = await getm3u8(request.url)
			console.log(url, request.title)
			downloadVideo(url, request.title, request.className, sender.tab.id)
		}
	});

function downloadNormalFile(info) {
	if (info.pageUrl.indexOf('https://plato.pusan.ac.kr/') == -1)
		return
	let xhr = new XMLHttpRequest();
	xhr.open('GET', info.linkUrl, true);
	xhr.onreadystatechange = function () { 
		if (this.readyState == 2) {
			let filename = this.responseURL.split('?')
			filename.pop()
			filename = filename.join('?').split('/')
			filename = decodeURI(filename.pop())

			let xhr2 = new XMLHttpRequest();
			xhr2.open('GET', this.responseURL, true)
			xhr2.responseType = "blob"
			xhr2.onreadystatechange = function() {
				if (xhr2.readyState === xhr2.DONE) {
					if (xhr2.status === 200 || xhr2.status === 201) {
						let a = document.createElement('a')
						a.download = filename
						a.href = URL.createObjectURL(xhr2.response)
						a.style.display = 'none'
						document.body.appendChild(a)
						a.click()
						a.remove()
					}
				}
			};
			xhr2.send()
		}
	};

	xhr.send()
}

chrome.contextMenus.create(
	{
		title: "PLATO_자료강제다운", 
		contexts:["link"], 
		onclick: downloadNormalFile
	}
);