// 智能取色器模块
import { showNotification } from './notification.js';

export function initColorTool() {
    // 获取必要的DOM元素并进行错误检查
    const elements = {
        colorPreview: document.getElementById('colorPreview'),
        hexColor: document.getElementById('hexColor'),
        rgbColor: document.getElementById('rgbColor'),
        hslColor: document.getElementById('hslColor'),
        colorHistory: document.getElementById('colorHistory')
    };

    // 检查所有必要的元素是否存在
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Color Tool: Missing required elements:', missingElements);
        return; // 如果缺少必要元素，提前退出初始化
    }

    const { colorPreview, hexColor, rgbColor, hslColor, colorHistory } = elements;
    
    console.log('Color Tool: All required elements found, initializing...');
    
    // 初始默认颜色
    const defaultColor = '#3498db';
    try {
        updateColorDisplay(defaultColor);
        console.log('Color Tool: Initial color display updated successfully');
    } catch (error) {
        console.error('Color Tool: Error updating initial color display:', error);
    }
    
    // 点击颜色预览区域打开颜色选择器
    colorPreview.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = hexColor.value || defaultColor;
        
        input.addEventListener('input', function() {
            updateColorDisplay(this.value);
        });
        
        input.addEventListener('change', function() {
            updateColorDisplay(this.value);
            addToColorHistory(this.value);
        });
        
        input.click();
    });
    
    // 更新颜色显示
    function updateColorDisplay(hex) {
        // 更新颜色预览
        colorPreview.style.backgroundColor = hex;
        
        // 更新HEX值
        hexColor.value = hex;
        
        // 转换为RGB
        const rgb = hexToRgb(hex);
        rgbColor.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        
        // 转换为HSL
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hslColor.value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
    }
    
    // 添加到颜色历史
    function addToColorHistory(hex) {
        // 检查是否已存在相同颜色
        const existingColors = colorHistory.querySelectorAll('.color-item');
        for (let i = 0; i < existingColors.length; i++) {
            if (existingColors[i].getAttribute('data-color') === hex) {
                return; // 已存在相同颜色，不添加
            }
        }
        
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.style.backgroundColor = hex;
        colorItem.setAttribute('data-color', hex);
        colorItem.title = hex;
        
        colorItem.addEventListener('click', function() {
            updateColorDisplay(this.getAttribute('data-color'));
        });
        
        // 限制历史记录数量
        if (existingColors.length >= 10) {
            colorHistory.removeChild(colorHistory.firstChild);
        }
        
        colorHistory.appendChild(colorItem);
        
        // 保存到本地存储
        saveColorHistory();
    }
    
    // 保存颜色历史到本地存储
    function saveColorHistory() {
        try {
            const colors = [];
            const colorItems = colorHistory.querySelectorAll('.color-item');
            
            colorItems.forEach(item => {
                colors.push(item.getAttribute('data-color'));
            });
            
            // 检查chrome.storage是否可用
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 'colorHistory': colors }, function() {
                    console.log('Color history saved');
                });
            } else {
                // 降级到localStorage
                localStorage.setItem('colorHistory', JSON.stringify(colors));
                console.log('Color history saved to localStorage');
            }
        } catch (error) {
            console.error('Error saving color history:', error);
        }
    }
    
    // 从本地存储加载颜色历史
    function loadColorHistory() {
        try {
            // 检查chrome.storage是否可用
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get('colorHistory', function(result) {
                    processStoredColors(result.colorHistory);
                });
            } else {
                // 降级到localStorage
                const storedColors = localStorage.getItem('colorHistory');
                if (storedColors) {
                    processStoredColors(JSON.parse(storedColors));
                }
            }
        } catch (error) {
            console.error('Error loading color history:', error);
        }
    }
    
    // 处理存储的颜色
    function processStoredColors(colors) {
        if (colors && Array.isArray(colors)) {
            colors.forEach(color => {
                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.style.backgroundColor = color;
                colorItem.setAttribute('data-color', color);
                colorItem.title = color;
                
                colorItem.addEventListener('click', function() {
                    updateColorDisplay(this.getAttribute('data-color'));
                });
                
                colorHistory.appendChild(colorItem);
            });
        }
    }
    
    // HEX转RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    // RGB转HSL
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // 灰色
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }
    
    // 初始化
    loadColorHistory();
    
    // 添加复制功能
    [hexColor, rgbColor, hslColor].forEach(input => {
        input.addEventListener('click', function() {
            this.select();
            document.execCommand('copy');
            showNotification('已复制到剪贴板');
        });
    });
}