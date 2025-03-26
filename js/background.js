// 扩展安装或更新时的处理
chrome.runtime.onInstalled.addListener(() => {
    // 创建右键菜单
    chrome.contextMenus.create({
        id: 'captureElement',
        title: '截取此元素',
        contexts: ['all']
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'captureElement') {
        chrome.tabs.sendMessage(tab.id, { 
            action: 'captureElement'
        });
    }
});

// 处理扩展图标点击
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'showCaptureOptions' });
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'captureTab':
            // 捕获当前标签页的可见区域
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                sendResponse({ dataUrl: dataUrl });
            });
            return true; // 保持消息通道开放，等待异步响应

        case 'openEditor':
            // 在新标签页中打开编辑器
            chrome.tabs.create({ 
                url: 'screenshot-editor.html?image=' + encodeURIComponent(request.dataUrl)
            });
            break;

        case 'startCapture':
            // 发送消息给内容脚本开始截图
            chrome.tabs.sendMessage(sender.tab.id, { 
                action: 'startCapture', 
                mode: request.mode,
                delay: request.delay 
            });
            break;
    }
});

// 处理快捷键命令
chrome.commands.onCommand.addListener((command) => {
    if (command === 'capture_viewport') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'startCapture', 
                    mode: 'viewport' 
                });
            }
        });
    }
});