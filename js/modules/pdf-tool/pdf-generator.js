// PDF生成器模块
import { showNotification } from '../notification.js';
import { checkDependencies, getPDFInstance } from './pdf-dependencies.js';

// 生成PDF文档的核心函数
export function generatePDF(imageData, previewElement) {
    try {
        // 检查依赖
        checkDependencies();
        
        // 创建图像对象以获取尺寸
        const img = new Image();
        img.onload = function() {
            try {
                // 获取图像尺寸
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // 计算PDF页面尺寸
                // 使用A4尺寸作为参考 (210 x 297 mm)
                const pdfWidth = 210;
                const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
                
                // 创建PDF实例
                const pdf = getPDFInstance();
                
                // 添加图像到PDF
                pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                
                // 生成PDF数据
                const pdfData = pdf.output('datauristring');
                
                // 显示预览
                showPDFPreview(pdfData, previewElement);
                
                // 添加下载按钮
                addDownloadButton(pdf, previewElement);
                
                // 显示成功通知
                showNotification('PDF生成成功', 'success');
            } catch (error) {
                console.error('生成PDF过程中出错:', error);
                showNotification('生成PDF过程中出错: ' + error.message, 'error');
            }
        };
        
        // 处理图像加载错误
        img.onerror = function() {
            showNotification('图像数据加载失败', 'error');
        };
        
        // 设置图像源
        img.src = imageData;
    } catch (error) {
        console.error('生成PDF过程中出错:', error);
        showNotification('生成PDF过程中出错: ' + error.message, 'error');
    }
}

// 显示PDF预览
function showPDFPreview(pdfData, previewElement) {
    // 清空预览区域
    previewElement.innerHTML = '';
    
    // 创建嵌入式PDF查看器
    const embed = document.createElement('embed');
    embed.src = pdfData;
    embed.type = 'application/pdf';
    embed.style.width = '100%';
    embed.style.height = '500px';
    embed.style.border = '1px solid #ddd';
    embed.style.borderRadius = '4px';
    
    // 添加到预览区域
    previewElement.appendChild(embed);
}

// 添加下载按钮
function addDownloadButton(pdf, previewElement) {
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'pdf-actions';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.marginBottom = '5px';
    
    // 创建下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-success';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载PDF';
    
    // 创建保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存PDF';
    
    // 添加下载事件
    downloadBtn.addEventListener('click', function() {
        try {
            // 生成文件名
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = 'webpage-' + timestamp + '.pdf';
            
            // 下载PDF
            pdf.save(filename);
            
            // 显示成功通知
            showNotification('PDF文件下载成功', 'success');
        } catch (error) {
            console.error('下载PDF时出错:', error);
            showNotification('下载PDF时出错: ' + error.message, 'error');
        }
    });
    
    // 添加保存事件（另一种方式保存，例如可以保存到云端或特定位置）
    saveBtn.addEventListener('click', function() {
        try {
            // 获取PDF数据
            const pdfData = pdf.output('blob');
            
            // 创建下载链接
            const url = URL.createObjectURL(pdfData);
            const link = document.createElement('a');
            link.href = url;
            
            // 生成文件名
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = 'webpage-' + timestamp + '.pdf';
            link.download = filename;
            
            // 触发点击
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            // 显示成功通知
            showNotification('PDF文件保存成功', 'success');
        } catch (error) {
            console.error('保存PDF时出错:', error);
            showNotification('保存PDF时出错: ' + error.message, 'error');
        }
    });
    
    // 添加按钮到容器
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(saveBtn);
    
    // 检查是否已有按钮容器
    const existingContainer = previewElement.querySelector('.pdf-actions');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // 添加到预览区域的顶部
    if (previewElement.firstChild) {
        previewElement.insertBefore(buttonContainer, previewElement.firstChild);
    } else {
        previewElement.appendChild(buttonContainer);
    }
}