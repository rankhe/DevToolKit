// HTML转PDF工具模块
import { showNotification } from './notification.js';

// 确保全局变量在模块中可用
let html2canvasModule;
let jsPDFModule;
let currentPdfData = null;

// 初始化必要的模块
function initModules() {
    return new Promise((resolve, reject) => {
        // 检查模块是否已经加载
        if (typeof window.html2canvas === 'function' && typeof window.jspdf === 'object') {
            html2canvasModule = window.html2canvas;
            jsPDFModule = window.jspdf;
            resolve();
            return;
        }

        // 如果模块未加载，显示错误
        reject(new Error('必要的模块未加载，请确保已引入html2canvas和jspdf'));
    });
}

// 导出 PDF 实例获取函数
export function getPDFInstance() {
    if (!jsPDFModule) {
        throw new Error('jsPDF模块未初始化');
    }
    return new jsPDFModule.jsPDF();
}

export function initPdfTool() {
    // 等待 DOM 加载完成
    function initializeElements() {
        const urlInput = document.getElementById('urlInput');
        const pdfConvert = document.getElementById('pdfConvert');
        const pdfSettings = document.getElementById('pdfSettings');
        const pdfPreview = document.getElementById('pdfPreview');
        
        // 检查必要的元素是否存在
        if (!urlInput || !pdfConvert || !pdfPreview) {
            console.error('PDF工具所需的DOM元素未找到');
            return;
        }

        // 转换按钮事件监听器
        pdfConvert.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (!url) {
                showNotification('请输入网页URL', 'error');
                return;
            }
            
            try {
                new URL(url); // 验证URL格式
            } catch (e) {
                showNotification('请输入有效的URL', 'error');
                return;
            }
            
            // 初始化必要的模块
            initModules().catch(error => {
                showNotification(error.message, 'error');
                return;
            });

            // 显示加载提示
            pdfPreview.innerHTML = '<div style="text-align: center; padding: 20px;">正在加载页面...</div>';
            
            // 创建一个新标签页来加载目标URL
            chrome.tabs.create({ url: url, active: false }, function(tab) {
                // 等待页面加载完成
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        // 移除监听器
                        chrome.tabs.onUpdated.removeListener(listener);
                        
                        // 执行截图
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: () => {
                                return document.documentElement.outerHTML;
                            }
                        }).then(results => {
                            if (!results || !results[0]?.result) {
                                throw new Error('无法获取页面内容');
                            }

                            // 创建iframe来显示内容
                            const iframe = document.createElement('iframe');
                            iframe.style.width = '100%';
                            iframe.style.height = '500px';
                            iframe.style.border = 'none';
                            iframe.sandbox = 'allow-same-origin'; // 只允许同源访问

                            // 清空预览区域并添加iframe
                            pdfPreview.innerHTML = '';
                            pdfPreview.appendChild(iframe);

                            // 将获取的HTML内容加载到iframe中
                            const blob = new Blob([results[0].result], { type: 'text/html' });
                            const blobUrl = URL.createObjectURL(blob);
                            iframe.src = blobUrl;

                            // 等待iframe加载完成
                            iframe.onload = function() {
                                // 释放Blob URL
                                URL.revokeObjectURL(blobUrl);

                                // 转换为PDF
                                setTimeout(() => {
                                    try {
                                        if (!html2canvasModule) {
                                            throw new Error('html2canvas模块未初始化');
                                        }
                                        html2canvasModule(iframe.contentDocument.body, {
                                            logging: false,
                                            useCORS: true,
                                            allowTaint: true
                                        }).then(canvas => {
                                            const imgData = canvas.toDataURL('image/png');
                                            const pdf = getPDFInstance();

                                            // 计算PDF页面尺寸
                                            const imgProps = pdf.getImageProperties(imgData);
                                            const pdfWidth = pdf.internal.pageSize.getWidth();
                                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                                            // 生成PDF数据
                                            const pdfData = pdf.output('datauristring');
                                            
                                            // 存储PDF数据用于导出
                                            currentPdfData = pdfData;
                                            
                                            // 使用blob创建安全URL进行预览
                                            const blob = new Blob([pdf.output('blob')], {type: 'application/pdf'});
                                            const blobUrl = URL.createObjectURL(blob);
                                            
                                            // 更新iframe源
                                            const iframe = document.querySelector('#pdfPreview iframe');
                                            if (iframe) {
                                                iframe.src = blobUrl;
                                                
                                                // 清理旧的blob URL
                                                iframe.onload = () => {
                                                    setTimeout(() => {
                                                        URL.revokeObjectURL(blobUrl);
                                                    }, 1000);
                                                };
                                            }

                                            // 显示导出按钮
                                            document.getElementById('pdfExport').style.display = 'inline-block';

                                            showNotification('PDF生成成功，可以点击导出按钮下载', 'success');
                                        }).catch(error => {
                                            showNotification('PDF生成失败: ' + error.message, 'error');
                                            console.error('PDF生成错误:', error);
                                        });
                                    } catch (error) {
                                        showNotification('PDF生成失败: ' + error.message, 'error');
                                        console.error('PDF生成错误:', error);
                                    }
                                }, 1000);
                            };

                            // 关闭临时标签页
                            chrome.tabs.remove(tab.id);
                        }).catch(error => {
                            console.error('脚本执行错误:', error);
                            showNotification('无法获取页面内容: ' + error.message, 'error');
                            // 关闭临时标签页
                            chrome.tabs.remove(tab.id);
                            
                            // 显示错误信息
                            pdfPreview.innerHTML = `
                                <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                                    <h3>无法转换该网页</h3>
                                    <p>原因：${error.message}</p>
                                    <p>建议尝试以下方法：</p>
                                    <ol>
                                        <li>检查网页地址是否正确</li>
                                        <li>确保网页可以正常访问</li>
                                        <li>尝试使用浏览器的打印功能（Ctrl+P 或 ⌘+P）</li>
                                    </ol>
                                </div>
                            `;
                        });
                    }
                });
            });
        });

        // 创建导出按钮
        const pdfExport = document.createElement('button');
        pdfExport.id = 'pdfExport';
        pdfExport.className = 'btn';
        pdfExport.textContent = '导出';
        pdfExport.style.display = 'none'; // 初始隐藏
        
        // 将导出按钮添加到工具栏
        if (pdfConvert && pdfConvert.parentNode) {
            pdfConvert.parentNode.insertBefore(pdfExport, pdfSettings);
        }
        
        // PDF数据存储
        let currentPdfData = null;
        
        // 导出按钮事件
        pdfExport.addEventListener('click', function() {
            if (currentPdfData) {
                try {
                    // 创建临时下载链接
                    const link = document.createElement('a');
                    link.href = currentPdfData;
                    link.download = `webpage-${new Date().toISOString().slice(0, 10)}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification('PDF导出成功', 'success');
                } catch (error) {
                    console.error('PDF导出失败:', error);
                    showNotification('PDF导出失败: ' + error.message, 'error');
                }
            } else {
                showNotification('没有可导出的PDF', 'error');
            }
        });
        
        // 辅助函数：将Data URI转换为Blob对象
        function dataURItoBlob(dataURI) {
            // 分离MIME类型和base64数据
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            
            // 将base64转换为二进制数组
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            return new Blob([ab], {type: mimeString});
        }
        
        // 设置按钮事件
        if (pdfSettings) {
            pdfSettings.addEventListener('click', function() {
                showNotification('PDF设置功能即将推出', 'info');
            });
        }
    }

    // 在 DOMContentLoaded 事件后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeElements);
    } else {
        initializeElements();
    }
}