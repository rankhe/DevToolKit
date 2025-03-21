// 通知系统模块
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 自动消失
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 添加通知样式
export function initNotificationStyle() {
    const notificationStyle = document.createElement('style');
    notificationStyle.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            background-color: #4CAF50;
            color: white;
            font-size: 14px;
            z-index: 1000;
            transition: opacity 0.3s ease;
        }
        
        .notification.error {
            background-color: #F44336;
        }
        
        .settings-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .setting-item {
            margin-bottom: 15px;
        }
        
        .setting-item label {
            display: block;
            margin-bottom: 5px;
        }
        
        .setting-item input[type="text"],
        .setting-item input[type="number"],
        .setting-item select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .settings-dialog .btn {
            margin-right: 10px;
            margin-top: 10px;
        }
    `;
    document.head.appendChild(notificationStyle);
}