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

function getm3u8(videoUrl) {
	return new Promise((resolve, reject) => {
		ajax({
			url: videoUrl,
			type:'get',
			success: (content) => {
				const arr = content.split('\n')
				for (e of arr) {
					if (e.indexOf('m3u8') != -1) {
						resolve(e.split('"')[1])
					}
				}
			}
		})
	})
	
}