// 确保消息监听器只被初始化一次
const initMessageListener = () => {
    if (window.jsonFormatListenerInitialized) return;
    window.jsonFormatListenerInitialized = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action); // 添加调试日志
    
    // 处理 ping 消息
    if (request.action === 'ping') {
        sendResponse({ pong: true });
        return true;
    }
    
    if (request.action === 'formatPageJson') {
        try {
            // 获取页面内容（尝试多种方式）
            let pageText = '';
            
            // 首先尝试获取pre标签中的内容
            const preElement = document.querySelector('pre');
            if (preElement) {
                pageText = preElement.textContent;
            } else {
                // 如果没有pre标签，则获取body的文本内容
                pageText = document.body.innerText;
            }
            
            // 移除可能的BOM标记
            pageText = pageText.replace(/^\uFEFF/, '');
            
            // 移除前后的空白字符
            pageText = pageText.trim();
            
            console.log('获取到的页面内容:', pageText.substring(0, 100) + '...'); // 添加调试日志
            
            // 尝试解析JSON
            const json = JSON.parse(pageText);
            
            // 格式化JSON
            const formattedJson = JSON.stringify(json, null, 2);
            
            console.log('JSON格式化成功'); // 添加调试日志
            
            // 注入CSS样式（检查是否已存在）
            if (!document.querySelector('link[href*="json-format.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = chrome.runtime.getURL('css/json-format.css');
                document.head.appendChild(cssLink);
            }
            
            // 创建带样式的预格式化内容
            const styledContent = `
                <pre class="json-formatted">${highlightJson(formattedJson)}</pre>
            `;
            
            // 替换页面内容
            document.body.innerHTML = styledContent;
            console.log('页面更新成功'); // 添加调试日志
            sendResponse({ 
                success: true, 
                message: 'JSON格式化成功',
                formattedContent: formattedJson // 返回格式化后的内容
            });
        } catch (e) {
            const errorMessage = e.message || '未知错误';
            console.error('格式化失败:', errorMessage); // 添加错误日志
            sendResponse({ 
                success: false, 
                message: '无效的JSON格式: ' + errorMessage 
            });
        }
    }
        return true;
    });
};

// 在页面加载完成时初始化
initMessageListener();

// 为了确保消息监听器的可靠性，我们也在 DOMContentLoaded 时初始化
document.addEventListener('DOMContentLoaded', initMessageListener);

// JSON语法高亮函数
function highlightJson(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
                // 移除键名后的冒号
                match = match.slice(0, -1);
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        
        return `<span class="${cls}">${match}</span>` + (cls === 'key' ? ':' : '');
    });
}