// 时间戳转换工具模块
export function initTimestampTool() {
    const timestampInput = document.getElementById('timestampInput');
    const unitRadios = document.querySelectorAll('input[name="unit"]');
    const localTime = document.getElementById('localTime');
    const utcTime = document.getElementById('utcTime');
    const isoTime = document.getElementById('isoTime');
    
    // 时间戳转换
    function updateTimeDisplay() {
        const timestamp = timestampInput.value.trim();
        if (!timestamp) {
            localTime.textContent = '-';
            utcTime.textContent = '-';
            isoTime.textContent = '-';
            return;
        }
        
        let unit = 's';
        unitRadios.forEach(radio => {
            if (radio.checked) unit = radio.value;
        });
        
        try {
            // 根据单位转换为毫秒
            let ms = parseInt(timestamp);
            if (unit === 's') ms *= 1000;
            if (unit === 'us') ms /= 1000;
            
            const date = new Date(ms);
            
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
            }
            
            localTime.textContent = date.toLocaleString();
            utcTime.textContent = date.toUTCString();
            isoTime.textContent = date.toISOString();
        } catch (e) {
            localTime.textContent = '无效时间戳';
            utcTime.textContent = '-';
            isoTime.textContent = '-';
        }
    }
    
    timestampInput.addEventListener('input', updateTimeDisplay);
    unitRadios.forEach(radio => {
        radio.addEventListener('change', updateTimeDisplay);
    });
    
    // 初始化时间戳为当前时间
    function initCurrentTimestamp() {
        const now = Math.floor(Date.now() / 1000);
        timestampInput.value = now;
        updateTimeDisplay();
    }
    
    initCurrentTimestamp();
}