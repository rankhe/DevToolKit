// PDF页面截图模块
import { showNotification } from '../notification.js';
import { generatePDF } from './pdf-generator.js';

// 在页面中直接执行的截图函数
export function capturePageToCanvas() {
    return new Promise((resolve) => {
        try {
            // 使用html2canvas直接截取页面
            html2canvas(document.body, {
                allowTaint: true,
                useCORS: true,
                scale: window.devicePixelRatio,
            }).then(canvas => {
                // 返回图像数据
                resolve({
                    imageData: canvas.toDataURL('image/png')
                });
            }).catch(error => {
                resolve({
                    error: error.message
                });
            });
        } catch (error) {
            resolve({
                error: error.message
            });
        }
    });
}

// 直接截图当前页面
export function captureCurrentPageDirectly(previewElement) {
    try {
        // 显示加载提示
        showNotification('正在转换页面为PDF，请稍候...', 'info');
        
        // 如果是在扩展环境中，需要获取当前活动标签页
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs && tabs[0]) {
                    // 向当前标签页发送消息，请求捕获页面
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'capturePage'}, function(response) {
                        if (response && response.imageData) {
                            // 使用返回的图像数据生成PDF
                            generatePDF(response.imageData, previewElement);
                            showNotification('页面转换成功', 'success');
                        } else {
                            // 如果无法通过内容脚本获取，则尝试直接截取当前页面
                            captureCurrentPageFallback(previewElement);
                        }
                    });
                } else {
                    // 无法获取当前标签页，尝试直接截取
                    captureCurrentPageFallback(previewElement);
                }
            });
        } else {
            // 不在扩展环境中，直接截取当前页面
            captureCurrentPageFallback(previewElement);
        }
    } catch (error) {
        console.error('转换页面时出错:', error);
        showNotification('转换页面时出错: ' + error.message, 'error');
        // 尝试回退方法
        captureCurrentPageFallback(previewElement);
    }
}

// 回退方法：直接使用html2canvas截取当前页面
function captureCurrentPageFallback(previewElement) {
    try {
        showNotification('正在处理页面内容...', 'info');
        
        // 配置html2canvas选项
        const options = {
            // 允许跨域图片
            allowTaint: true,
            useCORS: true,
            // 设置输出质量
            scale: window.devicePixelRatio || 2,
            // 设置背景色
            backgroundColor: '#ffffff',
            // 捕获整个页面内容
            height: Math.max(
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
                document.body.scrollHeight,
                document.body.offsetHeight
            ),
            // 设置窗口宽度
            windowWidth: document.documentElement.clientWidth,
            // 处理特殊元素
            onclone: function(clonedDoc) {
                // 处理可能影响截图的特殊元素
                const richText = clonedDoc.querySelector('#js_content');
                if (richText) {
                    richText.style.overflow = 'visible';
                    richText.style.height = 'auto';
                }
                
                // 移除可能影响截图的浮动元素
                const floatElements = clonedDoc.querySelectorAll('.toast_tips, .pay_tips, .reward_area, .fixed-top, .sticky-top');
                floatElements.forEach(el => el.remove());
                
                // 移除扩展自身的UI元素，避免递归截图
                const extensionUI = clonedDoc.querySelectorAll('.devtoolkit-ui, .pdf-preview, .pdf-actions');
                extensionUI.forEach(el => el.remove());
            }
        };

        // 执行截图
        html2canvas(document.body, options)
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                generatePDF(imgData, previewElement);
                showNotification('PDF生成成功', 'success');
            })
            .catch(error => {
                console.error('截图错误:', error);
                showNotification('生成PDF失败: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('截图过程中出错:', error);
        showNotification('截图过程中出错: ' + error.message, 'error');
    }
}