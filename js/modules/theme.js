// 主题管理模块
import { initChartTool } from './chart-tool.js';

export let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function initTheme(monacoEditor, chart) {
    const themeSwitch = document.querySelector('.theme-switch');
    
    // 初始化主题
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // 主题切换事件
    themeSwitch.addEventListener('click', function() {
        isDarkMode = !isDarkMode;
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        
        // 更新Monaco编辑器主题
        if (monacoEditor) {
            monacoEditor.updateOptions({ theme: isDarkMode ? 'vs-dark' : 'vs' });
        }
        
        // 更新图表主题
        if (chart) {
            chart.dispose();
            initChartTool();
        }
    });
}

// 工具切换逻辑
export function initToolSwitch() {
    const navItems = document.querySelectorAll('.nav-item');
    const toolPanels = document.querySelectorAll('.tool-panel');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const toolId = this.getAttribute('data-tool');
            
            // 更新导航菜单激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 更新工具面板显示
            toolPanels.forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(`${toolId}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}