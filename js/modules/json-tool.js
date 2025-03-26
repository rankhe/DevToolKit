// JSON格式化工具模块
import { showNotification } from './notification.js';

export function initJsonTool() {
    const jsonEditor = document.getElementById('jsonEditor');
    const jsonFormat = document.getElementById('jsonFormat');
    const jsonCompress = document.getElementById('jsonCompress');
    const jsonCopy = document.getElementById('jsonCopy');
    const formatPageJson = document.getElementById('formatPageJson');
    
    // 初始化JSON编辑器
    function initJsonEditor() {
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.padding = '10px';
        textarea.style.border = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
        textarea.style.fontSize = '14px';
        textarea.placeholder = '在此粘贴JSON数据...';
        
        jsonEditor.appendChild(textarea);
        
        return textarea;
    }
    
    const jsonTextarea = initJsonEditor();
    
    // 格式化JSON
    jsonFormat.addEventListener('click', function() {
        try {
            const json = JSON.parse(jsonTextarea.value);
            jsonTextarea.value = JSON.stringify(json, null, 2);
            showNotification('JSON格式化成功');
        } catch (e) {
            showNotification('无效的JSON格式', 'error');
        }
    });
    
    // 压缩JSON
    jsonCompress.addEventListener('click', function() {
        try {
            const json = JSON.parse(jsonTextarea.value);
            jsonTextarea.value = JSON.stringify(json);
            showNotification('JSON压缩成功');
        } catch (e) {
            showNotification('无效的JSON格式', 'error');
        }
    });
    
    // 复制JSON
    jsonCopy.addEventListener('click', function() {
        if (!jsonTextarea.value) {
            return;
        }
        
        navigator.clipboard.writeText(jsonTextarea.value)
            .then(() => showNotification('已复制到剪贴板'))
            .catch(() => showNotification('复制失败', 'error'));
    });

    // 格式化当前页面的JSON
    formatPageJson.addEventListener('click', async function() {
        try {
            // 获取当前标签页
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // 先尝试直接发送消息，如果失败再注入脚本
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
                if (!response || !response.pong) {
                    throw new Error('Content script not ready');
                }
            } catch (e) {
                // Content script 未注入或未响应，进行注入
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['js/content-scripts/json-format-content.js']
                });
            }
            
            // 向content script发送消息
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'formatPageJson' });
            
            if (response.success) {
                // 如果返回了格式化后的内容，显示在编辑器中
                if (response.formattedContent) {
                    jsonTextarea.value = response.formattedContent;
                }
                showNotification('页面JSON格式化成功');
            } else {
                showNotification(response.message || '格式化失败', 'error');
            }
        } catch (e) {
            showNotification('操作失败：' + (e.message || '未知错误'), 'error');
        }
    });
}