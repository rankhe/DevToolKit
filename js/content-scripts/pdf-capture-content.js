// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'capturePage') {
        capturePage().then(imageData => {
            sendResponse({imageData: imageData});
        }).catch(error => {
            console.error('页面捕获失败:', error);
            sendResponse({error: error.message});
        });
        return true; // 保持消息通道开放
    }
});

// 捕获页面内容
async function capturePage() {
    try {
        // 配置html2canvas选项
        const options = {
            allowTaint: true,
            useCORS: true,
            scale: window.devicePixelRatio || 2,
            backgroundColor: '#ffffff',
            height: Math.max(
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
                document.body.scrollHeight,
                document.body.offsetHeight
            ),
            windowWidth: document.documentElement.clientWidth,
            onclone: function(clonedDoc) {
                // 处理特殊元素
                const floatElements = clonedDoc.querySelectorAll(
                    '.fixed-top, .sticky-top, .floating-ad, .modal, .popup'
                );
                floatElements.forEach(el => el.remove());
            }
        };

        // 执行截图
        const canvas = await html2canvas(document.body, options);
        return canvas.toDataURL('image/png');
    } catch (error) {
        throw new Error('页面捕获失败: ' + error.message);
    }
}