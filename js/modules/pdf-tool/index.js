// PDF工具模块入口点
import { checkDependencies } from './pdf-dependencies.js';
import { capturePageToCanvas, captureCurrentPageDirectly } from './pdf-capture.js';
import { convertUrlToPdf } from './pdf-converter.js';
import { generatePDF } from './pdf-generator.js';

// 导出所有功能
export {
    checkDependencies,
    capturePageToCanvas,
    captureCurrentPageDirectly,
    convertUrlToPdf,
    generatePDF
};

// 初始化PDF工具
export function initPdfTool(container) {
    if (!container) {
        console.error('初始化PDF工具失败：未提供容器元素');
        return;
    }
    
    try {
        // 检查依赖
        checkDependencies();
        
        // 创建工具界面
        createPdfToolUI(container);
    } catch (error) {
        console.error('PDF工具初始化失败:', error);
        showErrorMessage(container, error.message);
    }
}

// 创建PDF工具界面
function createPdfToolUI(container) {
    // 创建工具标题
    const title = document.createElement('h3');
    title.textContent = 'PDF工具';
    title.className = 'tool-title';
    
    // 创建工具说明
    const description = document.createElement('p');
    description.textContent = '将网页转换为PDF文档';
    description.className = 'tool-description';
    
    // 创建工具容器
    const toolContainer = document.createElement('div');
    toolContainer.className = 'pdf-tool-container';
    toolContainer.style.display = 'flex';
    toolContainer.style.flexDirection = 'column';
    toolContainer.style.gap = '10px';
    
    // 创建按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = '10px';
    
    // 创建当前页面转换按钮
    const currentPageBtn = document.createElement('button');
    currentPageBtn.id = 'convertCurrentPage';
    currentPageBtn.className = 'btn btn-primary';
    currentPageBtn.innerHTML = '<i class="fas fa-file-pdf"></i> 转换当前页面';
    
    // 创建URL输入区域
    const urlContainer = document.createElement('div');
    urlContainer.className = 'url-input-container';
    urlContainer.style.display = 'flex';
    urlContainer.style.gap = '10px';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.id = 'pdfUrlInput';
    urlInput.className = 'form-control';
    urlInput.placeholder = '输入网页URL后按Enter或点击转换';
    urlInput.style.flex = '1';
    
    const urlButton = document.createElement('button');
    urlButton.id = 'convertUrlToPdf';
    urlButton.className = 'btn btn-primary';
    urlButton.innerHTML = '<i class="fas fa-file-pdf"></i> 转换URL';
    
    // 创建预览区域
    const previewArea = document.createElement('div');
    previewArea.id = 'pdfPreview';
    previewArea.className = 'pdf-preview';
    previewArea.style.marginTop = '10px';
    previewArea.style.flex = '1';
    previewArea.style.minHeight = '200px';
    previewArea.style.border = '1px solid #ddd';
    previewArea.style.borderRadius = '4px';
    
    // 组装界面
    buttonGroup.appendChild(currentPageBtn);
    urlContainer.appendChild(urlInput);
    urlContainer.appendChild(urlButton);
    
    toolContainer.appendChild(buttonGroup);
    toolContainer.appendChild(urlContainer);
    toolContainer.appendChild(previewArea);
    
    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(toolContainer);
    
    // 添加事件监听器
    urlButton.addEventListener('click', () => {
        const url = urlInput.value;
        if (url) {
            convertUrlToPdf(url, previewArea);
        }
    });
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && urlInput.value) {
            convertUrlToPdf(urlInput.value, previewArea);
        }
    });
    
    currentPageBtn.addEventListener('click', () => {
        captureCurrentPageDirectly(previewArea);
    });
}

// 显示错误消息
function showErrorMessage(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">初始化失败</h4>
            <p>${message}</p>
            <hr>
            <p class="mb-0">请确保已加载所有必要的依赖库，包括html2canvas和jsPDF。</p>
        </div>
    `;
}