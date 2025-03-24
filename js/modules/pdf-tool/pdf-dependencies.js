// PDF工具依赖检查模块

// 检查必要的依赖是否已加载
export function checkDependencies() {
    if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas 未加载');
    }
    if (typeof jspdf === 'undefined') {
        throw new Error('jsPDF 未加载');
    }
}

// 导出 PDF 实例获取函数
export function getPDFInstance() {
    checkDependencies();
    return new jspdf.jsPDF();
}