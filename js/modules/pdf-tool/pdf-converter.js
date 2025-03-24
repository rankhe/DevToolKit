// PDF转换器模块 - 处理URL到PDF的转换
import { showNotification } from '../notification.js';
import { generatePDF } from './pdf-generator.js';
import { checkDependencies } from './pdf-dependencies.js';

// 将URL转换为PDF
export function convertUrlToPdf(url, previewElement) {
    try {
        // 验证URL
        if (!url) {
            showNotification('请输入URL地址', 'error');
            return;
        }
        
        // 添加http前缀（如果没有）
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // 再次验证URL
        if (!isValidUrl(url)) {
            showNotification('请输入有效的URL地址', 'error');
            return;
        }
        
        // 显示加载提示
        showNotification('正在处理URL内容，请稍候...', 'info');
        
        // 显示加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <p>正在加载 ${url} 的内容...</p>
        `;
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.padding = '20px';
        
        // 清空预览区域并添加加载指示器
        previewElement.innerHTML = '';
        previewElement.appendChild(loadingIndicator);
        
        // 使用background.js中的方法来获取URL内容
        chrome.runtime.sendMessage(
            { action: 'captureUrl', url: url },
            function(response) {
                // 移除加载指示器
                loadingIndicator.remove();
                
                if (response && response.success && response.imageData) {
                    // 生成PDF
                    generatePDF(response.imageData, previewElement);
                    showNotification('PDF生成成功', 'success');
                } else {
                    const errorMsg = response && response.error ? response.error : '无法加载URL内容';
                    console.error('URL加载失败:', errorMsg);
                    showNotification('URL加载失败: ' + errorMsg, 'error');
                    
                    // 显示错误信息
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            <h4>URL加载失败</h4>
                            <p>${errorMsg}</p>
                            <hr>
                            <p class="mb-0">请检查URL是否正确，或尝试其他URL</p>
                        </div>
                    `;
                    previewElement.appendChild(errorElement);
                }
            }
        );
    } catch (error) {
        console.error('URL转换过程中出错:', error);
        showNotification('URL转换过程中出错: ' + error.message, 'error');
        
        // 显示错误信息
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4>处理错误</h4>
                <p>${error.message}</p>
            </div>
        `;
        previewElement.innerHTML = '';
        previewElement.appendChild(errorElement);
    }
}

// 添加样式
function addPdfConverterStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #3498db;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleElement);
}

// 在模块加载时添加样式
addPdfConverterStyles();
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    
    // 添加加载事件
    iframe.onload = function() {
        try {
            // 尝试访问iframe内容
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // 使用html2canvas截取iframe内容
            html2canvas(iframeDoc.body, {
                allowTaint: true,
                useCORS: true,
                scale: 2,
                logging: false,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                // 获取图像数据
                const imgData = canvas.toDataURL('image/png');
                
                // 生成PDF
                generatePDF(imgData, previewElement);
                
                // 移除iframe
                document.body.removeChild(iframe);
                
                // 显示成功通知
                showNotification('页面加载完成，正在生成PDF...', 'info');
            }).catch(error => {
                handleIframeError(error, url, previewElement);
            });
        } catch (error) {
            handleIframeError(error, url, previewElement);
        }
    };
    
    // 添加错误处理
    iframe.onerror = function(error) {
        handleIframeError(error, url, previewElement);
    };
    
    // 设置iframe源并添加到文档
    iframe.src = url;
    document.body.appendChild(iframe);
    
    // 设置超时处理
    setTimeout(function() {
        if (document.body.contains(iframe)) {
            handleIframeError(new Error('加载超时'), url, previewElement);
        }
    }, 30000); // 30秒超时
}

// 处理iframe加载错误
function handleIframeError(error, url, previewElement) {
    console.error('无法加载URL内容:', error);
    
    // 移除可能存在的iframe
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        if (iframe.src === url) {
            document.body.removeChild(iframe);
        }
    });
    
    // 显示错误信息
    showNotification('无法直接加载URL内容: ' + error.message, 'error');
    
    // 提供备选方案
    showAlternativeSolution(url, previewElement);
}

// 显示备选解决方案
function showAlternativeSolution(url, previewElement) {
    // 清空预览区域
    previewElement.innerHTML = '';
    
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-warning';
    errorDiv.innerHTML = `
        <h4 class="alert-heading">无法直接加载URL内容</h4>
        <p>由于浏览器安全限制，无法直接加载和转换外部URL。</p>
        <hr>
        <p class="mb-0">您可以尝试以下替代方案：</p>
        <ol>
            <li>打开目标网页，然后使用"截图当前页面"功能</li>
            <li>或者使用下面的按钮在新标签页中打开URL，然后使用扩展的截图功能</li>
        </ol>
    `;
    
    // 创建打开URL按钮
    const openBtn = document.createElement('button');
    openBtn.className = 'btn btn-primary';
    openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> 在新标签页中打开URL';
    openBtn.onclick = function() {
        window.open(url, '_blank');
    };
    
    // 添加到预览区域
    previewElement.appendChild(errorDiv);
    previewElement.appendChild(openBtn);
}

// 验证URL是否有效
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}