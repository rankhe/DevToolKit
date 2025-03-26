// 编码/解码工具模块
import { showNotification } from './notification.js';

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 哈希函数工具类
class HashUtils {
    // MD5 实现
    static async md5(message) {
        // MD5 算法实现
        function md5cycle(x, k) {
            let a = x[0], b = x[1], c = x[2], d = x[3];
            
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
            
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
            
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
            
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
            
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }
        
        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }
        
        function ff(a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }
        
        function gg(a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }
        
        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }
        
        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        }
        
        function md51(s) {
            const n = s.length,
                state = [1732584193, -271733879, -1732584194, 271733878];
            let i;
            for (i = 64; i <= s.length; i += 64) {
                md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < s.length; i++)
                tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i++) tail[i] = 0;
            }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }
        
        function md5blk(s) {
            const md5blks = [];
            for (let i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = s.charCodeAt(i) +
                    (s.charCodeAt(i + 1) << 8) +
                    (s.charCodeAt(i + 2) << 16) +
                    (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
        }
        
        function add32(a, b) {
            return (a + b) & 0xFFFFFFFF;
        }
        
        function hex(x) {
            let result = '';
            for (let i = 0; i < x.length; i++) {
                result += ((x[i] >>> 0).toString(16)).padStart(8, '0');
            }
            return result;
        }
        
        // 将字符串转换为UTF-8编码
        function utf8Encode(str) {
            let result = '';
            for (let i = 0; i < str.length; i++) {
                const c = str.charCodeAt(i);
                if (c < 128) {
                    result += String.fromCharCode(c);
                } else if (c > 127 && c < 2048) {
                    result += String.fromCharCode((c >> 6) | 192);
                    result += String.fromCharCode((c & 63) | 128);
                } else {
                    result += String.fromCharCode((c >> 12) | 224);
                    result += String.fromCharCode(((c >> 6) & 63) | 128);
                    result += String.fromCharCode((c & 63) | 128);
                }
            }
            return result;
        }
        
        // 执行MD5计算
        const utf8Msg = utf8Encode(message);
        const hash = hex(md51(utf8Msg));
        return hash;
    }

    static async sha1(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async sha512(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// 编码工具类
class EncoderUtils {
    static base64Encode(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            throw new Error('Base64编码失败：输入包含非法字符');
        }
    }

    static async md5Encode(str) {
        return HashUtils.md5(str);
    }

    static base64Decode(str) {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            throw new Error('Base64解码失败：输入不是有效的Base64字符串');
        }
    }

    static urlEncode(str) {
        return encodeURIComponent(str);
    }

    static urlDecode(str) {
        try {
            return decodeURIComponent(str);
        } catch (e) {
            throw new Error('URL解码失败：输入包含非法字符');
        }
    }

    static htmlEncode(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static htmlDecode(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent;
    }

    static hexEncode(str) {
        return Array.from(str)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
    }

    static hexDecode(hex) {
        try {
            return hex.match(/.{1,2}/g)
                .map(byte => String.fromCharCode(parseInt(byte, 16)))
                .join('');
        } catch (e) {
            throw new Error('Hex解码失败：输入不是有效的十六进制字符串');
        }
    }
}

// URL 解析工具类
class UrlParser {
    static parseUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = Array.from(urlObj.searchParams.entries());
            return {
                protocol: urlObj.protocol,
                host: urlObj.host,
                pathname: urlObj.pathname,
                params: params,
                hash: urlObj.hash
            };
        } catch (e) {
            throw new Error('URL解析失败：不是有效的URL格式');
        }
    }

    static checkSecurity(url) {
        const dangerousPatterns = [
            /<script>/i,
            /javascript:/i,
            /data:/i,
            /vbscript:/i
        ];
        return dangerousPatterns.some(pattern => pattern.test(url));
    }
}

// 文件处理工具类
class FileProcessor {
    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    static async fileToHex(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const array = new Uint8Array(reader.result);
                const hex = Array.from(array)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                resolve(hex);
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    static async calculateFileHash(file, algorithm = 'SHA-256') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const buffer = reader.result;
                    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    resolve(hashHex);
                } catch (e) {
                    reject(new Error('文件哈希计算失败'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }
}

// 历史记录管理器
class HistoryManager {
    static async saveHistory(operation) {
        const history = await this.getHistory();
        history.unshift(operation);
        if (history.length > 20) {
            history.pop();
        }
        await chrome.storage.local.set({ encodeHistory: history });
    }

    static async getHistory() {
        const result = await chrome.storage.local.get('encodeHistory');
        return result.encodeHistory || [];
    }

    static async searchHistory(keyword) {
        const history = await this.getHistory();
        return history.filter(item => 
            item.input.includes(keyword) || 
            item.output.includes(keyword) ||
            item.type.includes(keyword)
        );
    }

    static async clearHistory() {
        await chrome.storage.local.remove('encodeHistory');
    }
}

export function initEncodeTool() {
    const encodeInput = document.getElementById('encodeInput');
    const encodeOutput = document.getElementById('encodeOutput');
    const encodeType = document.getElementById('encodeType');
    const encodeMode = document.getElementById('encodeMode');
    const encodeSalt = document.getElementById('encodeSalt');
    const encodeFile = document.getElementById('encodeFile');
    const encodeCopy = document.getElementById('encodeCopy');
    const encodeClear = document.getElementById('encodeClear');
    const encodeHistory = document.getElementById('encodeHistory');

    // 实时编码/解码处理函数
    const processInput = debounce(async () => {
        try {
            const input = encodeInput.value;
            const type = encodeType.value;
            const mode = encodeMode.value;
            const salt = encodeSalt.value;

            if (!input) {
                encodeOutput.value = '';
                return;
            }

            let result;
            if (mode === 'encode') {
                switch (type) {
                    case 'base64':
                        result = EncoderUtils.base64Encode(input);
                        break;
                    case 'url':
                        result = EncoderUtils.urlEncode(input);
                        break;
                    case 'html':
                        result = EncoderUtils.htmlEncode(input);
                        break;
                    case 'hex':
                        result = EncoderUtils.hexEncode(input);
                        break;
                    case 'md5encode':
                        result = await HashUtils.md5(input + salt);
                        break;
                    case 'md5':
                        result = await HashUtils.md5(input + salt);
                        break;
                    case 'sha1':
                        result = await HashUtils.sha1(input + salt);
                        break;
                    case 'sha256':
                        result = await HashUtils.sha256(input + salt);
                        break;
                    case 'sha512':
                        result = await HashUtils.sha512(input + salt);
                        break;
                }
            } else {
                switch (type) {
                    case 'base64':
                        result = EncoderUtils.base64Decode(input);
                        break;
                    case 'url':
                        result = EncoderUtils.urlDecode(input);
                        break;
                    case 'html':
                        result = EncoderUtils.htmlDecode(input);
                        break;
                    case 'hex':
                        result = EncoderUtils.hexDecode(input);
                        break;
                    default:
                        throw new Error('此格式不支持解码');
                }
            }

            encodeOutput.value = result;

            // 保存到历史记录
            await HistoryManager.saveHistory({
                type,
                mode,
                input,
                output: result,
                timestamp: Date.now()
            });

            updateHistoryDisplay();
        } catch (error) {
            showNotification(error.message, 'error');
            encodeOutput.value = '错误: ' + error.message;
        }
    }, 500);

    // URL 解析功能
    const parseUrlInput = debounce(async (input) => {
        try {
            if (input.startsWith('http')) {
                const urlInfo = UrlParser.parseUrl(input);
                const hasSecurity = UrlParser.checkSecurity(input);
                
                if (hasSecurity) {
                    showNotification('警告：URL中包含潜在危险内容', 'warning');
                }

                const urlDetails = `协议: ${urlInfo.protocol}
主机: ${urlInfo.host}
路径: ${urlInfo.pathname}
哈希: ${urlInfo.hash}

查询参数:
${urlInfo.params.map(([key, value]) => `${key}: ${value}`).join('\n')}`;

                encodeOutput.value = urlDetails;
            }
        } catch (error) {
            // 忽略非URL输入的错误
        }
    }, 500);

    // 格式化编码类型名称
    const formatEncodingType = (type) => {
        const typeMap = {
            'base64': 'Base64',
            'url': 'URL',
            'html': 'HTML',
            'hex': 'HEX',
            'md5encode': 'MD5 编码',
            'md5': 'MD5 哈希',
            'sha1': 'SHA-1',
            'sha256': 'SHA-256',
            'sha512': 'SHA-512'
        };
        return typeMap[type] || type.toUpperCase();
    };
    
    // 格式化模式名称
    const formatModeName = (mode) => {
        return mode === 'encode' ? '编码' : '解码';
    };
    
    // 格式化时间
    const formatTime = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        
        // 如果是今天
        if (date.toDateString() === now.toDateString()) {
            return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 如果是昨天
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 其他日期
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // 更新历史记录显示
    const updateHistoryDisplay = async () => {
        const history = await HistoryManager.getHistory();
        
        if (history.length === 0) {
            encodeHistory.innerHTML = `
                <div class="history-empty">
                    <p>暂无历史记录</p>
                    <p class="history-empty-tip">您的操作历史将显示在这里</p>
                </div>
            `;
            return;
        }
        
        encodeHistory.innerHTML = `
            <div class="history-header">
                <h3>历史记录</h3>
                <button id="clearHistory" class="history-clear-btn" title="清空历史记录">清空</button>
            </div>
            ${history.map(item => `
                <div class="history-item" data-input="${encodeURIComponent(item.input)}" data-type="${item.type}" data-mode="${item.mode}">
                    <div class="history-info">
                        <span class="history-type" title="${item.type === 'md5' || item.type === 'sha1' || item.type === 'sha256' || item.type === 'sha512' ? '哈希算法' : '编码格式'}">${formatEncodingType(item.type)}</span>
                        <span class="history-mode" title="操作类型">${formatModeName(item.mode)}</span>
                        <span class="history-time" title="${new Date(item.timestamp).toLocaleString()}">${formatTime(item.timestamp)}</span>
                    </div>
                    <div class="history-content">
                        <div class="history-input" title="${item.input}">${item.input.substring(0, 50)}${item.input.length > 50 ? '...' : ''}</div>
                        <div class="history-output" title="${item.output}">${item.output.substring(0, 50)}${item.output.length > 50 ? '...' : ''}</div>
                    </div>
                </div>
            `).join('')}
        `;
        
        // 添加清空历史记录按钮事件
        document.getElementById('clearHistory')?.addEventListener('click', async () => {
            await HistoryManager.clearHistory();
            updateHistoryDisplay();
            showNotification('历史记录已清空');
        });
    };

    // 添加UI动画效果
    const addUIEffects = () => {
        // 文本框获取焦点时添加高亮效果
        encodeInput.addEventListener('focus', () => {
            encodeInput.parentElement.classList.add('input-focused');
        });
        
        encodeInput.addEventListener('blur', () => {
            encodeInput.parentElement.classList.remove('input-focused');
        });
        
        // 选择框变化时添加过渡动画
        encodeType.addEventListener('change', () => {
            encodeType.classList.add('select-changed');
            setTimeout(() => {
                encodeType.classList.remove('select-changed');
            }, 300);
        });
        
        encodeMode.addEventListener('change', () => {
            encodeMode.classList.add('select-changed');
            setTimeout(() => {
                encodeMode.classList.remove('select-changed');
            }, 300);
        });
        
        // 复制按钮点击动画
        encodeCopy.addEventListener('click', function() {
            this.classList.add('btn-clicked');
            setTimeout(() => {
                this.classList.remove('btn-clicked');
            }, 300);
        });
        
        // 清空按钮点击动画
        encodeClear.addEventListener('click', function() {
            this.classList.add('btn-clicked');
            setTimeout(() => {
                this.classList.remove('btn-clicked');
            }, 300);
        });
    };
    
    // 事件监听器
    encodeInput.addEventListener('input', () => {
        processInput();
        parseUrlInput(encodeInput.value);
    });
    
    // 添加拖放文件支持
    
    encodeType.addEventListener('change', processInput);
    encodeMode.addEventListener('change', processInput);
    encodeSalt.addEventListener('input', processInput);
    // encodeFile.addEventListener('change', handleFileSelect);

    encodeCopy.addEventListener('click', () => {
        if (!encodeOutput.value) {
            showNotification('没有可复制的内容', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(encodeOutput.value)
            .then(() => showNotification('已复制到剪贴板'))
            .catch(() => showNotification('复制失败', 'error'));
    });

    // 历史记录项点击事件
    encodeHistory.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (historyItem && !e.target.closest('#clearHistory')) {
            try {
                // 恢复输入值
                encodeInput.value = decodeURIComponent(historyItem.dataset.input);
                
                // 恢复编码类型和模式
                encodeType.value = historyItem.dataset.type;
                encodeMode.value = historyItem.dataset.mode;
                
                // 高亮显示选中的历史记录
                document.querySelectorAll('.history-item').forEach(item => {
                    item.classList.remove('history-item-selected');
                });
                historyItem.classList.add('history-item-selected');
                
                // 处理输入
                processInput();
                
                // 显示通知
                showNotification('已恢复历史记录');
                
                // 滚动到顶部
                encodeInput.scrollTop = 0;
                encodeOutput.scrollTop = 0;
            } catch (error) {
                showNotification('恢复历史记录失败', 'error');
            }
        }
    });

    // 初始化历史记录显示
    updateHistoryDisplay();
    
    // 设置UI效果
    addUIEffects();
}