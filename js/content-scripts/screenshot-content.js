// 截图工具的内容脚本

// 创建Web Worker实例
let imageWorker;
try {
    imageWorker = new Worker(chrome.runtime.getURL('js/content-scripts/screenshot-worker.js'));
    imageWorker.onmessage = handleWorkerMessage;
} catch (error) {
    console.error('Web Worker 初始化失败:', error);
}

// 处理Worker消息
function handleWorkerMessage(e) {
    const { action, result } = e.data;
    if (action === 'mergeComplete') {
        openScreenshotEditor(result);
    }
}

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
        
        // 分段截图
        const totalSegments = Math.ceil(fullHeight / viewportHeight);
        const imageSegments = [];
        
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
                
                // 将图片数据添加到数组
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewportWidth;
                tempCanvas.height = viewportHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0);
                
                // 获取图片数据
                const imageData = tempCtx.getImageData(0, 0, viewportWidth, viewportHeight);
                imageSegments.push(imageData);
            }
        }
        
        // 恢复原始滚动位置
        window.scrollTo(0, originalScrollTop);
        
        // 使用Web Worker处理图片合并
        if (imageWorker) {
            imageWorker.postMessage({
                action: 'mergeImages',
                data: {
                    images: imageSegments,
                    width: viewportWidth,
                    height: fullHeight,
                    segmentHeight: viewportHeight
                }
            });
        } else {
            // 降级处理：在主线程中合并图片
            const canvas = document.createElement('canvas');
            canvas.width = viewportWidth;
            canvas.height = fullHeight;
            const ctx = canvas.getContext('2d');
            
            imageSegments.forEach((imageData, i) => {
                ctx.putImageData(imageData, 0, i * viewportHeight);
            });
            
            openScreenshotEditor(canvas.toDataURL());
        }
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

    // 创建放大镜
    const magnifier = document.createElement('div');
    magnifier.className = 'magnifier';
    overlay.appendChild(magnifier);

    // 创建快捷键提示
    const shortcuts = document.createElement('div');
    shortcuts.className = 'shortcuts-tips';
    shortcuts.innerHTML = `
        <div>空格键：确认选择</div>
        <div>Esc键：取消选择</div>
        <div>Shift键：锁定比例</div>
    `;
    overlay.appendChild(shortcuts);

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
        // 更新放大镜
        updateMagnifier(e, magnifier);
        
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

    // 键盘事件处理
    const keyHandler = (e) => {
        switch (e.key) {
            case 'Escape':
                // 取消截图
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', keyHandler);
                break;
            case ' ':
                // 空格键确认选择
                if (isSelecting) {
                    e.preventDefault();
                    confirmSelection();
                }
                break;
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

// 更新放大镜
function updateMagnifier(e, magnifier) {
    const zoom = 3; // 放大倍率
    const size = 100; // 放大镜大小
    
    // 获取鼠标位置的图像数据
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 计算放大镜位置
    const x = e.clientX - size / 2;
    const y = e.clientY - size - 20; // 显示在光标上方
    
    // 捕获屏幕内容
    ctx.drawImage(
        document.documentElement,
        e.clientX - size / zoom / 2,
        e.clientY - size / zoom / 2,
        size / zoom,
        size / zoom,
        0,
        0,
        size,
        size
    );
    
    // 更新放大镜样式
    magnifier.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        border: 2px solid #1a73e8;
        border-radius: 50%;
        background-image: url(${canvas.toDataURL()});
        pointer-events: none;
        z-index: 1000000;
    `;
}

// 滚动截图功能
async function captureScroll() {
    const overlay = document.createElement('div');
    overlay.className = 'scroll-capture-overlay';
    overlay.innerHTML = `
        <div class="scroll-capture-controls">
            <button id="start-scroll-capture">开始滚动截图</button>
            <button id="stop-scroll-capture" style="display: none;">停止截图</button>
        </div>
    `;
    document.body.appendChild(overlay);

    let isCapturing = false;
    let capturedImages = [];
    let lastScrollTop = 0;
    const scrollStep = window.innerHeight / 2; // 每次滚动半个屏幕高度

    document.getElementById('start-scroll-capture').onclick = async () => {
        isCapturing = true;
        document.getElementById('start-scroll-capture').style.display = 'none';
        document.getElementById('stop-scroll-capture').style.display = 'block';
        
        while (isCapturing) {
            // 捕获当前视图
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: 'captureTab' },
                    (response) => resolve(response)
                );
            });

            if (response && response.dataUrl) {
                capturedImages.push(response.dataUrl);
            }

            // 滚动页面
            lastScrollTop = window.scrollY;
            window.scrollBy(0, scrollStep);

            // 如果滚动位置没有改变，说明已到达底部
            if (lastScrollTop === window.scrollY) {
                stopScrollCapture();
                break;
            }

            // 等待页面重新渲染
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    };

    document.getElementById('stop-scroll-capture').onclick = stopScrollCapture;

    function stopScrollCapture() {
        isCapturing = false;
        document.body.removeChild(overlay);
        mergeScrollCaptures(capturedImages);
    }
}

// 合并滚动截图
function mergeScrollCaptures(images) {
    if (images.length === 0) return;

    // 加载第一张图片来获取尺寸
    const firstImage = new Image();
    firstImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = firstImage.width;
        canvas.height = firstImage.height * images.length;
        const ctx = canvas.getContext('2d');

        // 加载并绘制所有图片
        let loadedCount = 0;
        images.forEach((dataUrl, index) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, index * firstImage.height);
                loadedCount++;

                if (loadedCount === images.length) {
                    openScreenshotEditor(canvas.toDataURL());
                }
            };
            img.src = dataUrl;
        });
    };
    firstImage.src = images[0];
}

// 打开截图编辑器
function openScreenshotEditor(dataUrl) {
    // 创建一个新的标签页来编辑截图
    chrome.runtime.sendMessage({
        action: 'openEditor',
        dataUrl: dataUrl
    });
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .magnifier {
        display: none;
    }
    .screenshot-overlay:hover .magnifier {
        display: block;
    }
    .shortcuts-tips {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000000;
    }
    .scroll-capture-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000000;
    }
    .scroll-capture-controls button {
        padding: 8px 16px;
        margin: 5px;
        border: none;
        border-radius: 4px;
        background: #1a73e8;
        color: white;
        cursor: pointer;
    }
    .scroll-capture-controls button:hover {
        background: #1557b0;
    }
`;
document.head.appendChild(style);

// 初始化截图工具
initScreenshotTool();