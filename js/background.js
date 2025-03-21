// 截图工具的后台脚本

// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "captureElement",
        title: "截取此元素",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "captureViewport",
        title: "截取当前视口",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "captureFullPage",
        title: "截取整个页面",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "captureSelection",
        title: "截取选定区域",
        contexts: ["page"]
    });
});

// 处理上下文菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "captureElement":
            captureElement(tab.id, info.targetElementId);
            break;
        case "captureViewport":
            captureViewport(tab.id);
            break;
        case "captureFullPage":
            captureFullPage(tab.id);
            break;
        case "captureSelection":
            captureSelection(tab.id);
            break;
    }
});

// 捕获元素
function captureElement(tabId, elementId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: (elementId) => {
            // 向页面内容脚本发送消息
            chrome.runtime.sendMessage({
                action: "elementCapture",
                elementSelector: `[data-element-id="${elementId}"]`
            });
        },
        args: [elementId]
    });
}

// 捕获当前视口
function captureViewport(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            // 向页面内容脚本发送消息
            chrome.runtime.sendMessage({
                action: "startCapture",
                mode: "viewport"
            });
        }
    });
}

// 捕获整个页面
function captureFullPage(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            // 向页面内容脚本发送消息
            chrome.runtime.sendMessage({
                action: "startCapture",
                mode: "fullpage"
            });
        }
    });
}

// 捕获选定区域
function captureSelection(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            // 向页面内容脚本发送消息
            chrome.runtime.sendMessage({
                action: "startCapture",
                mode: "selection"
            });
        }
    });
}

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureTab") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            sendResponse({ dataUrl: dataUrl });
        });
        return true; // 保持消息通道打开，等待异步响应
    }
});

// 注册命令快捷键
chrome.commands.onCommand.addListener((command) => {
    if (command === "capture_viewport") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                captureViewport(tabs[0].id);
            }
        });
    }
});