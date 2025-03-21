// 主入口文件
import { initNotificationStyle } from './js/modules/notification.js';
import { initTheme, initToolSwitch } from './js/modules/theme.js';
import { initJsonTool } from './js/modules/json-tool.js';
import { initTimestampTool } from './js/modules/timestamp-tool.js';
import { initDiffTool } from './js/modules/diff-tool.js';
import { initChartTool } from './js/modules/chart-tool.js';
import { initPdfTool } from './js/modules/pdf-tool.js';
import { initColorTool } from './js/modules/color-tool.js';
import { initSettings } from './js/modules/settings.js';
import TranslateTool from './js/modules/translate-tool.js';
import { initEncodeTool } from './js/modules/encode-tool.js';
// 内容脚本不能直接导入，需要通过消息通信

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化通知样式
    initNotificationStyle();
    
    // 初始化工具切换
    initToolSwitch();
    
    // 初始化各个工具模块
    const chart = initChartTool();
    initJsonTool();
    initTimestampTool();
    initDiffTool();
    initPdfTool();
    initColorTool();
    initEncodeTool();
    // 初始化截图工具
    document.getElementById('screenshotCapture')?.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'startCapture', mode: 'selection' });
            }
        });
    });
    
    // 初始化翻译工具
    new TranslateTool();
    
    // 初始化主题
    initTheme(null, chart);
    
    // 初始化设置
    initSettings();
});