
chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		if (request.action === 'DOWNLOAD') {
			const url = await getm3u8(request.url)
			console.log(url, request.title)
			downloadVideo(url, request.title, request.id)
		}
	});