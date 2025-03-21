// 截图工具的内容脚本

// 初始化截图工具
function initScreenshotTool() {
    // 创建截图工具容器
    const container = document.createElement('div');
    container.id = 'screenshot-tool-container';
    container.style.display = 'none';
    document.body.appendChild(container);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #screenshot-tool-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
        }
        
        .screenshot-canvas {
            position: absolute;
            top: 0;
            left: 0;
        }
        
        .screenshot-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            cursor: crosshair;
            z-index: 999999;
        }
        
        .screenshot-selection {
            position: absolute;
            border: 2px solid #1a73e8;
            background: rgba(26, 115, 232, 0.1);
            pointer-events: none;
        }
        
        .pixel-ruler {
            position: absolute;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
        }
        
        .reference-line {
            position: absolute;
            background: rgba(26, 115, 232, 0.5);
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// 处理来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'startCapture':
            startCapture(request.mode, request.delay || 0);
            break;
        case 'elementCapture':
            captureElement(request.elementSelector);
            break;
    }
});

// 开始截图
async function startCapture(mode, delay = 0) {
    // 如果设置了延迟
    if (delay > 0) {
        await showDelayTimer(delay);
    }

    switch (mode) {
        case 'viewport':
            captureViewport();
            break;
        case 'fullpage':
            captureFullPage();
            break;
        case 'selection':
            captureSelection();
            break;
    }
}

// 显示延迟计时器
function showDelayTimer(seconds) {
    return new Promise((resolve) => {
        const timer = document.createElement('div');
        timer.className = 'delay-timer';
        document.body.appendChild(timer);

        let remainingTime = seconds;
        
        const updateTimer = () => {
            timer.textContent = remainingTime;
            if (remainingTime <= 0) {
                clearInterval(interval);
                document.body.removeChild(timer);
                resolve();
            }
            remainingTime--;
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
    });
}

// 捕获当前视口
async function captureViewport() {
    try {
        // 请求后台脚本捕获当前标签页
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: 'captureTab' },
                (response) => resolve(response)
            );
        });

        if (response && response.dataUrl) {
            openScreenshotEditor(response.dataUrl);
        }
    } catch (error) {
        console.error('视口截图失败:', error);
    }
}

// 捕获整个页面
async function captureFullPage() {
    try {
        const fullHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // 保存原始滚动位置
        const originalScrollTop = window.scrollY;
        
        // 创建离屏画布
        const canvas = document.createElement('canvas');
        canvas.width = viewportWidth;
        canvas.height = fullHeight;
        const ctx = canvas.getContext('2d');
        
        // 分段截图
        const totalSegments = Math.ceil(fullHeight / viewportHeight);
        
        for (let i = 0; i < totalSegments; i++) {
            // 滚动到指定位置
            window.scrollTo(0, i * viewportHeight);
            
            // 等待页面重新渲染
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 捕获当前视口
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: 'captureTab' },
                    (response) => resolve(response)
                );
            });
            
            if (response && response.dataUrl) {
                // 加载图片
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = response.dataUrl;
                });
                
                // 绘制到画布上
                ctx.drawImage(
                    img,
                    0, 0, viewportWidth, viewportHeight,
                    0, i * viewportHeight, viewportWidth, viewportHeight
                );
            }
        }
        
        // 恢复原始滚动位置
        window.scrollTo(0, originalScrollTop);
        
        // 打开编辑器
        openScreenshotEditor(canvas.toDataURL());
    } catch (error) {
        console.error('全页面截图失败:', error);
        // 确保恢复原始滚动位置
        window.scrollTo(0, originalScrollTop || 0);
    }
}

// 捕获选定区域
function captureSelection() {
    // 创建选择覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'screenshot-overlay';
    document.body.appendChild(overlay);

    // 创建选择框
    const selection = document.createElement('div');
    selection.className = 'screenshot-selection';
    overlay.appendChild(selection);

    // 创建像素标尺
    const ruler = document.createElement('div');
    ruler.className = 'pixel-ruler';
    overlay.appendChild(ruler);

    // 跟踪鼠标状态
    let isSelecting = false;
    let startX = 0;
    let startY = 0;

    // 鼠标按下事件
    overlay.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        selection.style.width = '0';
        selection.style.height = '0';
        ruler.style.display = 'none';
    });

    // 鼠标移动事件
    overlay.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        let width = e.clientX - startX;
        let height = e.clientY - startY;

        // Shift键锁定正方形比例
        if (e.shiftKey) {
            const size = Math.min(Math.abs(width), Math.abs(height));
            width = width < 0 ? -size : size;
            height = height < 0 ? -size : size;
        }

        const currentX = width < 0 ? startX + width : startX;
        const currentY = height < 0 ? startY + height : startY;
        const currentWidth = Math.abs(width);
        const currentHeight = Math.abs(height);

        // 更新选择框
        selection.style.left = currentX + 'px';
        selection.style.top = currentY + 'px';
        selection.style.width = currentWidth + 'px';
        selection.style.height = currentHeight + 'px';

        // 更新像素标尺
        ruler.style.display = 'block';
        ruler.textContent = `${currentWidth} × ${currentHeight}`;
        ruler.style.left = (currentX + currentWidth + 10) + 'px';
        ruler.style.top = (currentY + currentHeight + 10) + 'px';
    });

    // 鼠标释放事件
    overlay.addEventListener('mouseup', async (e) => {
        if (!isSelecting) return;
        isSelecting = false;

        // 获取选择区域
        const rect = selection.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) {
            // 选择太小，取消截图
            document.body.removeChild(overlay);
            return;
        }

        try {
            // 捕获当前视口
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: 'captureTab' },
                    (response) => resolve(response)
                );
            });

            if (response && response.dataUrl) {
                // 裁剪选定区域
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = response.dataUrl;
                });

                const canvas = document.createElement('canvas');
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(
                    img,
                    rect.left, rect.top, rect.width, rect.height,
                    0, 0, rect.width, rect.height
                );

                // 打开编辑器
                openScreenshotEditor(canvas.toDataURL());
            }
        } catch (error) {
            console.error('选区截图失败:', error);
        } finally {
            // 移除覆盖层
            document.body.removeChild(overlay);
        }
    });

    // 按ESC键取消截图
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);
}

// 捕获特定元素
async function captureElement(selector) {
    try {
        const element = document.querySelector(selector);
        if (!element) {
            console.error('未找到目标元素:', selector);
            return;
        }

        const rect = element.getBoundingClientRect();
        
        // 捕获当前视口
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: 'captureTab' },
                (response) => resolve(response)
            );
        });

        if (response && response.dataUrl) {
            // 裁剪元素区域
            const img = new Image();
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = response.dataUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = rect.width;
            canvas.height = rect.height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(
                img,
                rect.left, rect.top, rect.width, rect.height,
                0, 0, rect.width, rect.height
            );

            // 打开编辑器
            openScreenshotEditor(canvas.toDataURL());
        }
    } catch (error) {
        console.error('元素截图失败:', error);
    }
}

// 打开截图编辑器
function openScreenshotEditor(dataUrl) {
    // 创建一个新的标签页来编辑截图
    chrome.runtime.sendMessage({
        action: 'openEditor',
        dataUrl: dataUrl
    });
}

// 初始化截图工具
initScreenshotTool();