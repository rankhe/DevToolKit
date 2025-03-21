// 导入必要的模块
import { showNotification } from './modules/notification.js';
import { getPDFInstance } from './modules/pdf-tool.js';

class ScreenshotEditor {
    constructor() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = null;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentColor = '#000000';
        this.currentWidth = 4;
        this.currentFont = 'Arial';
        this.history = [];
        this.historyIndex = -1;
        this.maxHistoryLength = 50;

        // 初始化
        this.initializeCanvas();
        this.initializeTools();
        this.initializeEventListeners();
    }

    // 初始化画布
    initializeCanvas() {
        // 从URL参数获取图片数据
        const urlParams = new URLSearchParams(window.location.search);
        const imageData = urlParams.get('image');

        if (imageData) {
            const img = new Image();
            img.onload = () => {
                // 设置画布大小为图片大小
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                // 绘制图片
                this.ctx.drawImage(img, 0, 0);
                // 保存初始状态
                this.saveState();
            };
            img.src = imageData;
        }
    }

    // 初始化工具
    initializeTools() {
        this.tools = {
            arrow: {
                draw: (x1, y1, x2, y2) => this.drawArrow(x1, y1, x2, y2),
                cursor: 'crosshair'
            },
            line: {
                draw: (x1, y1, x2, y2) => this.drawLine(x1, y1, x2, y2),
                cursor: 'crosshair'
            },
            rectangle: {
                draw: (x1, y1, x2, y2) => this.drawRectangle(x1, y1, x2, y2),
                cursor: 'crosshair'
            },
            circle: {
                draw: (x1, y1, x2, y2) => this.drawCircle(x1, y1, x2, y2),
                cursor: 'crosshair'
            },
            text: {
                draw: (x, y) => this.addText(x, y),
                cursor: 'text'
            },
            mosaic: {
                draw: (x1, y1, x2, y2) => this.applyMosaic(x1, y1, x2, y2),
                cursor: 'crosshair'
            },
            blur: {
                draw: (x1, y1, x2, y2) => this.applyBlur(x1, y1, x2, y2),
                cursor: 'crosshair'
            }
        };
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 工具选择
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTool = e.target.dataset.tool;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.canvas.style.cursor = this.tools[this.currentTool].cursor;
                
                // 显示/隐藏相关设置
                const fontSelector = document.querySelector('.font-selector');
                fontSelector.style.display = this.currentTool === 'text' ? 'block' : 'none';
            });
        });

        // 颜色选择
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.currentColor = e.target.dataset.color;
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 线宽选择
        document.querySelectorAll('.width-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.currentWidth = parseInt(e.target.dataset.width);
                document.querySelectorAll('.width-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 字体选择
        document.getElementById('font-select').addEventListener('change', (e) => {
            this.currentFont = e.target.value;
        });

        // 画布事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

        // 按钮事件
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('ocr-btn').addEventListener('click', () => this.performOCR());
        document.getElementById('save-btn').addEventListener('click', () => this.showSaveOptions());

        // 保存格式选择
        document.querySelectorAll('.save-format').forEach(btn => {
            btn.addEventListener('click', (e) => this.save(e.target.dataset.format));
        });
    }

    // 鼠标事件处理
    handleMouseDown(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;

        if (this.currentTool === 'text') {
            this.addText(this.startX, this.startY);
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing || this.currentTool === 'text') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 创建临时画布进行预览
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 复制当前状态
        tempCtx.drawImage(this.canvas, 0, 0);

        // 绘制当前工具
        this.tools[this.currentTool].draw.call(this, this.startX, this.startY, x, y, tempCtx);

        // 更新画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    handleMouseUp() {
        if (!this.isDrawing || this.currentTool === 'text') return;

        this.isDrawing = false;
        this.saveState();
    }

    // 绘图工具实现
    drawArrow(x1, y1, x2, y2, context = this.ctx) {
        const headLength = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = this.currentColor;
        context.lineWidth = this.currentWidth;
        context.stroke();

        // 箭头头部
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        context.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        context.closePath();
        context.fillStyle = this.currentColor;
        context.fill();
    }

    drawLine(x1, y1, x2, y2, context = this.ctx) {
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = this.currentColor;
        context.lineWidth = this.currentWidth;
        context.stroke();
    }

    drawRectangle(x1, y1, x2, y2, context = this.ctx) {
        const width = x2 - x1;
        const height = y2 - y1;
        context.beginPath();
        context.rect(x1, y1, width, height);
        context.strokeStyle = this.currentColor;
        context.lineWidth = this.currentWidth;
        context.stroke();
    }

    drawCircle(x1, y1, x2, y2, context = this.ctx) {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        context.beginPath();
        context.arc(x1, y1, radius, 0, 2 * Math.PI);
        context.strokeStyle = this.currentColor;
        context.lineWidth = this.currentWidth;
        context.stroke();
    }

    addText(x, y) {
        const text = prompt('请输入文字：');
        if (!text) return;

        this.ctx.font = `${this.currentWidth * 4}px ${this.currentFont}`;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fillText(text, x, y);
        this.saveState();
    }

    applyMosaic(x1, y1, x2, y2) {
        const blockSize = 10;
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        const startX = Math.min(x1, x2);
        const startY = Math.min(y1, y2);

        // 获取区域图像数据
        const imageData = this.ctx.getImageData(startX, startY, width, height);
        const data = imageData.data;

        // 应用马赛克效果
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                let r = 0, g = 0, b = 0, count = 0;

                // 计算块的平均颜色
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                // 将块中的所有像素设置为平均颜色
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                    }
                }
            }
        }

        this.ctx.putImageData(imageData, startX, startY);
        this.saveState();
    }

    applyBlur(x1, y1, x2, y2) {
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        const startX = Math.min(x1, x2);
        const startY = Math.min(y1, y2);

        // 获取区域图像数据
        const imageData = this.ctx.getImageData(startX, startY, width, height);
        const data = imageData.data;
        const blurRadius = 5;

        // 创建临时数组存储模糊后的数据
        const blurredData = new Uint8ClampedArray(data);

        // 应用高斯模糊
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;

                // 遍历周围像素
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                    for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const i = (ny * width + nx) * 4;
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            a += data[i + 3];
                            count++;
                        }
                    }
                }

                // 计算平均值
                const i = (y * width + x) * 4;
                blurredData[i] = r / count;
                blurredData[i + 1] = g / count;
                blurredData[i + 2] = b / count;
                blurredData[i + 3] = a / count;
            }
        }

        // 更新图像数据
        imageData.data.set(blurredData);
        this.ctx.putImageData(imageData, startX, startY);
        this.saveState();
    }

    // 历史记录管理
    saveState() {
        // 删除当前位置之后的历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 添加新状态
        this.history.push(this.canvas.toDataURL());
        
        // 如果历史记录太长，删除最早的记录
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        // 更新按钮状态
        this.updateButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
            this.updateButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
            this.updateButtons();
        }
    }

    loadState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    updateButtons() {
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
        document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
    }

    // 导出功能
    async copyToClipboard() {
        try {
            const blob = await new Promise(resolve => this.canvas.toBlob(resolve));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showNotification('已复制到剪贴板');
        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            showNotification('复制失败，请重试', 'error');
        }
    }

    async performOCR() {
        try {
            showNotification('正在进行文字识别...');
            const { createWorker } = Tesseract;
            const worker = await createWorker('chi_sim');
            const { data: { text } } = await worker.recognize(this.canvas);
            await worker.terminate();

            // 创建结果对话框
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                z-index: 1000;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
            `;
            dialog.innerHTML = `
                <h3>识别结果</h3>
                <textarea style="width: 100%; min-height: 200px;">${text}</textarea>
                <div style="text-align: right; margin-top: 10px;">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">关闭</button>
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value)">复制</button>
                </div>
            `;
            document.body.appendChild(dialog);
        } catch (error) {
            console.error('OCR识别失败:', error);
            showNotification('OCR识别失败，请重试', 'error');
        }
    }

    showSaveOptions() {
        const dropdown = document.querySelector('.save-format-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }

    async save(format) {
        try {
            let blob;
            let filename = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}`;

            switch (format) {
                case 'png':
                    blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
                    filename += '.png';
                    break;
                case 'jpeg':
                    blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/jpeg', 0.9));
                    filename += '.jpg';
                    break;
                case 'pdf':
                    const pdf = getPDFInstance();
                    const imgData = this.canvas.toDataURL('image/jpeg', 1.0);
                    pdf.addImage(imgData, 'JPEG', 0, 0, this.canvas.width, this.canvas.height);
                    blob = pdf.output('blob');
                    filename += '.pdf';
                    break;
                default:
                    throw new Error('不支持的格式');
            }

            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);

            showNotification('保存成功');
        } catch (error) {
            console.error('保存失败:', error);
            showNotification('保存失败，请重试', 'error');
        } finally {
            // 隐藏格式选择下拉框
            document.querySelector('.save-format-dropdown').style.display = 'none';
        }
    }
}

// 初始化编辑器
window.addEventListener('DOMContentLoaded', () => {
    new ScreenshotEditor();
});