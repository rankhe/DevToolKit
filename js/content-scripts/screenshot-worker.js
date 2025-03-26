// Web Worker for image processing
self.onmessage = function(e) {
    const { action, data } = e.data;
    
    switch (action) {
        case 'mergeImages':
            mergeImages(data);
            break;
    }
};

// 合并图片片段
function mergeImages({ images, width, height, segmentHeight }) {
    // 创建离屏 Canvas（在 Worker 中使用 OffscreenCanvas）
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 处理每个图片片段
    Promise.all(images.map((imageData, index) => {
        return createImageBitmap(imageData).then(bitmap => {
            ctx.drawImage(
                bitmap,
                0, index * segmentHeight, width, segmentHeight,
                0, index * segmentHeight, width, segmentHeight
            );
        });
    })).then(() => {
        // 将合并后的图像发送回主线程
        canvas.convertToBlob().then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                self.postMessage({
                    action: 'mergeComplete',
                    result: reader.result
                });
            };
            reader.readAsDataURL(blob);
        });
    });
}