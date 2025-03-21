// 设置管理模块
import { showNotification } from './notification.js';

// 默认设置
const defaultSettings = {
    theme: 'system',
    fontSize: 14,
    indentSize: 2,
    defaultTool: 'json'
};

// 当前设置
let currentSettings = {};

// 初始化设置
export function initSettings() {
    // 确保在DOM加载完成后再初始化
    function initialize() {
        // 从存储加载设置
        chrome.storage.sync.get('settings', function(data) {
            currentSettings = data.settings || defaultSettings;
            applySettings();
        });
        
        // 设置按钮点击事件
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', showSettingsDialog);
        } else {
            console.warn('未找到设置按钮，请确认HTML中包含id为settingsButton的元素');
        }
    }

    // 确保DOM已经加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
}

// 应用设置
function applySettings() {
    // 应用字体大小
    document.documentElement.style.setProperty('--font-size', `${currentSettings.fontSize}px`);
    
    // 应用其他设置
    // ...
}

// 显示设置对话框
function showSettingsDialog() {
    // 检查是否已存在设置对话框
    const existingDialog = document.querySelector('.settings-dialog');
    if (existingDialog) {
        return; // 如果已经存在对话框，则不创建新的
    }

    const dialog = document.createElement('div');
    dialog.className = 'settings-dialog';
    dialog.innerHTML = `
        <h3>设置</h3>
        
        <div class="setting-item">
            <label for="theme">主题</label>
            <select id="theme">
                <option value="system" ${currentSettings.theme === 'system' ? 'selected' : ''}>跟随系统</option>
                <option value="light" ${currentSettings.theme === 'light' ? 'selected' : ''}>浅色</option>
                <option value="dark" ${currentSettings.theme === 'dark' ? 'selected' : ''}>深色</option>
            </select>
        </div>
        
        <div class="setting-item">
            <label for="fontSize">字体大小</label>
            <input type="number" id="fontSize" value="${currentSettings.fontSize}" min="10" max="24">
        </div>
        
        <div class="setting-item">
            <label for="indentSize">缩进大小</label>
            <input type="number" id="indentSize" value="${currentSettings.indentSize}" min="1" max="8">
        </div>
        
        <div class="setting-item">
            <label for="defaultTool">默认工具</label>
            <select id="defaultTool">
                <option value="json" ${currentSettings.defaultTool === 'json' ? 'selected' : ''}>JSON格式化</option>
                <option value="timestamp" ${currentSettings.defaultTool === 'timestamp' ? 'selected' : ''}>时间戳转换</option>
                <option value="diff" ${currentSettings.defaultTool === 'diff' ? 'selected' : ''}>文本对比</option>
                <option value="chart" ${currentSettings.defaultTool === 'chart' ? 'selected' : ''}>数据可视化</option>
                <option value="pdf" ${currentSettings.defaultTool === 'pdf' ? 'selected' : ''}>HTML转PDF</option>
                <option value="screenshot" ${currentSettings.defaultTool === 'screenshot' ? 'selected' : ''}>截图工具</option>
            </select>
        </div>
        
        <div class="dialog-buttons">
            <button class="btn primary" id="saveSettings">保存</button>
            <button class="btn" id="cancelSettings">取消</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 保存设置
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const newSettings = {
                theme: document.getElementById('theme')?.value || defaultSettings.theme,
                fontSize: parseInt(document.getElementById('fontSize')?.value) || defaultSettings.fontSize,
                indentSize: parseInt(document.getElementById('indentSize')?.value) || defaultSettings.indentSize,
                defaultTool: document.getElementById('defaultTool')?.value || defaultSettings.defaultTool
            };
            
            // 保存到存储
            chrome.storage.sync.set({ settings: newSettings }, function() {
                currentSettings = newSettings;
                applySettings();
                document.body.removeChild(dialog);
                showNotification('设置已保存');
            });
        });
    }
    
    // 取消设置
    const cancelButton = document.getElementById('cancelSettings');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
    }
}