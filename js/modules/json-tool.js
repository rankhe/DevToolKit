// JSON格式化工具模块
import { showNotification } from './notification.js';

export function initJsonTool() {
    const jsonEditor = document.getElementById('jsonEditor');
    const jsonFormat = document.getElementById('jsonFormat');
    const jsonCompress = document.getElementById('jsonCompress');
    const jsonCopy = document.getElementById('jsonCopy');
    
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
}