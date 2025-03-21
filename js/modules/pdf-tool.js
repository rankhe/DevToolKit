// HTML转PDF工具模块
import { showNotification } from './notification.js';

// 导出 PDF 实例获取函数
export function getPDFInstance() {
    return new jspdf.jsPDF();
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
            
            // 创建一个iframe来加载网页
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '500px';
            iframe.style.border = 'none';
            
            // 清空预览区域并添加iframe
            pdfPreview.innerHTML = '';
            pdfPreview.appendChild(iframe);
            
            // 加载URL
            iframe.src = url;
            
            // 等待页面加载完成
            iframe.onload = function() {
                // 转换为PDF
                setTimeout(() => {
                    html2canvas(iframe.contentDocument.body).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = getPDFInstance();
                        
                        // 计算PDF页面尺寸
                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        
                        // 显示PDF预览
                        const pdfData = pdf.output('datauristring');
                        iframe.src = pdfData;
                        
                        showNotification('PDF生成成功');
                    }).catch(error => {
                        showNotification('PDF生成失败: ' + error.message, 'error');
                    });
                }, 1000); // 给页面足够的时间加载
            };
        });

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