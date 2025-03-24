// 翻译工具模块
class TranslateTool {
  constructor() {
    // 注意：这是一个示例密钥，实际使用时应该从用户配置中读取
    this.apiKey = ''; // 初始化为空，从存储中加载
    this.region = 'eastasia'; // 默认区域
    this.endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    this.debounceTimer = null;
    this.isTestingApi = false;
    this.debugMode = true; // 启用调试模式，可以从设置中控制
    this.init();
  }
  
  /**
   * 记录调试日志
   * @param {string} level - 日志级别 (log, info, warn, error)
   * @param {string} category - 日志类别
   * @param {any} data - 日志数据
   */
  logDebug(level = 'log', category, data) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[TranslateTool][${timestamp}][${category}]`;
    
    switch (level) {
      case 'info':
        console.info(prefix, data);
        break;
      case 'warn':
        console.warn(prefix, data);
        break;
      case 'error':
        console.error(prefix, data);
        break;
      default:
        console.log(prefix, data);
    }
  }

  async init() {
    await this.loadConfig();
    this.initLanguageCodes();
    this.bindEvents();
    this.initContextMenu();
  }
  
  /**
   * 初始化支持的语言代码映射
   */
  initLanguageCodes() {
    // 微软翻译API支持的语言代码
    // 参考: https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/language-support
    this.supportedLanguages = {
      'af': 'Afrikaans',
      'ar': 'Arabic',
      'bg': 'Bulgarian',
      'bn': 'Bangla',
      'bs': 'Bosnian',
      'ca': 'Catalan',
      'cs': 'Czech',
      'cy': 'Welsh',
      'da': 'Danish',
      'de': 'German',
      'el': 'Greek',
      'en': 'English',
      'es': 'Spanish',
      'et': 'Estonian',
      'fa': 'Persian',
      'fi': 'Finnish',
      'fil': 'Filipino',
      'fr': 'French',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'hr': 'Croatian',
      'ht': 'Haitian Creole',
      'hu': 'Hungarian',
      'id': 'Indonesian',
      'is': 'Icelandic',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'ms': 'Malay',
      'mt': 'Maltese',
      'nl': 'Dutch',
      'no': 'Norwegian',
      'pl': 'Polish',
      'pt': 'Portuguese',
      'ro': 'Romanian',
      'ru': 'Russian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'sr': 'Serbian',
      'sv': 'Swedish',
      'sw': 'Swahili',
      'ta': 'Tamil',
      'th': 'Thai',
      'tr': 'Turkish',
      'uk': 'Ukrainian',
      'ur': 'Urdu',
      'vi': 'Vietnamese',
      'zh-Hans': 'Chinese Simplified',
      'zh-Hant': 'Chinese Traditional',
      // 添加更多可能的语言代码
      'yue': 'Cantonese',
      'mww': 'Hmong Daw',
      'otq': 'Querétaro Otomi',
      'sr-Cyrl': 'Serbian (Cyrillic)',
      'sr-Latn': 'Serbian (Latin)',
      'tlh-Latn': 'Klingon',
      'tlh-Piqd': 'Klingon (plqaD)',
      'yua': 'Yucatec Maya',
      'kmr': 'Kurdish (Northern)'
    };
    
    // 记录初始化的语言代码
    this.logDebug('info', 'Language Codes', {
      supportedCount: Object.keys(this.supportedLanguages).length
    });
  }
  
  /**
   * 规范化语言代码
   * @param {string} langCode - 输入的语言代码
   * @returns {string} - 规范化后的语言代码
   */
  normalizeLanguageCode(langCode) {
    if (!langCode || langCode === 'auto') return 'auto';
    
    // 特殊语言代码映射
    const specialMappings = {
      'zh': 'zh-Hans',      // 中文默认使用简体中文
      'zh-CN': 'zh-Hans',   // 简体中文
      'zh-TW': 'zh-Hant',   // 繁体中文
      'zh-HK': 'zh-Hant',   // 香港繁体中文
      'pt-BR': 'pt',        // 巴西葡萄牙语
      'pt-PT': 'pt',        // 欧洲葡萄牙语
      'nb': 'no',           // 挪威语
      'nn': 'no',           // 挪威尼诺斯克语
    };
    
    // 检查特殊映射
    if (specialMappings.hasOwnProperty(langCode)) {
      this.logDebug('info', 'Language Mapping', {
        from: langCode,
        to: specialMappings[langCode]
      });
      return specialMappings[langCode];
    }
    
    return langCode;
  }
  
  /**
   * 验证语言代码是否受支持
   * @param {string} langCode - 要验证的语言代码
   * @returns {boolean} - 是否支持
   */
  isLanguageSupported(langCode) {
    const normalizedCode = this.normalizeLanguageCode(langCode);
    return normalizedCode === 'auto' || this.supportedLanguages.hasOwnProperty(normalizedCode);
  }

  async loadConfig() {
    const config = await chrome.storage.sync.get([
      'translatorApiKey', 
      'defaultTargetLang', 
      'translatorDebugMode',
      'translatorRegion'
    ]);
    
    this.apiKey = config.translatorApiKey || '';
    this.defaultTargetLang = config.defaultTargetLang || 'en';
    this.debugMode = config.translatorDebugMode !== undefined ? config.translatorDebugMode : true;
    this.region = config.translatorRegion || 'eastasia'; // 默认使用东亚区域
    
    this.logDebug('info', 'Config', {
      defaultTargetLang: this.defaultTargetLang,
      debugMode: this.debugMode,
      region: this.region,
      apiKeyConfigured: this.apiKey ? '已配置' : '未配置'
    });
    
    // 设置默认目标语言
    const targetLanguage = document.querySelector('#targetLanguage');
    if (targetLanguage) {
      targetLanguage.value = this.defaultTargetLang;
    }
  }

  bindEvents() {
    // 语言选择和切换
    const sourceLanguage = document.querySelector('#sourceLanguage');
    const targetLanguage = document.querySelector('#targetLanguage');
    const swapLanguages = document.querySelector('#swapLanguages');

    if (sourceLanguage && targetLanguage && swapLanguages) {
      swapLanguages.addEventListener('click', () => {
        // 如果源语言是自动检测，不进行切换
      if (sourceLanguage.value === 'auto') return;
      
      // 获取规范化后的语言代码
      const sourceValue = this.normalizeLanguageCode(sourceLanguage.value);
      const targetValue = this.normalizeLanguageCode(targetLanguage.value);
      
      // 交换语言
      sourceLanguage.value = targetValue;
      targetLanguage.value = sourceValue;
        this.translate();
      });

      sourceLanguage.addEventListener('change', () => this.translate());
      targetLanguage.addEventListener('change', () => this.translate());
    }

    // 翻译按钮
    const translateBtn = document.querySelector('#translateBtn');
    if (translateBtn) {
      translateBtn.addEventListener('click', () => this.translate());
    }

    // 源文本操作
    const sourceText = document.querySelector('#sourceText');
    const clearSource = document.querySelector('#clearSource');
    const pasteSource = document.querySelector('#pasteSource');

    if (sourceText && clearSource && pasteSource) {
      sourceText.addEventListener('input', () => {
        this.debounceTranslate();
      });

      clearSource.addEventListener('click', () => {
        sourceText.value = '';
        document.querySelector('#targetText').value = '';
      });

      pasteSource.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          sourceText.value = text;
          this.translate();
        } catch (err) {
          this.logDebug('error', 'Paste Failed', err);
        }
      });
    }

    // 目标文本操作
    const copyTarget = document.querySelector('#copyTarget');
    const speakTarget = document.querySelector('#speakTarget');

    if (copyTarget && speakTarget) {
      copyTarget.addEventListener('click', () => this.copyTranslation());
      speakTarget.addEventListener('click', () => this.speakTranslation());
    }
  }

  debounceTranslate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.translate();
    }, 500);
  }

  async translate() {
    // 如果正在测试API，不执行翻译
    if (this.isTestingApi) return;
    
    if (!this.apiKey) {
      this.showApiConfig();
      return;
    }

    const sourceText = document.querySelector('#sourceText')?.value.trim();
    if (!sourceText) return;

    let sourceLang = document.querySelector('#sourceLanguage')?.value;
    let targetLang = document.querySelector('#targetLanguage')?.value;
    const targetTextArea = document.querySelector('#targetText');

    if (!targetTextArea) return;
    
    // 规范化语言代码
    sourceLang = this.normalizeLanguageCode(sourceLang);
    targetLang = this.normalizeLanguageCode(targetLang);
    
    // 记录语言代码转换
    this.logDebug('info', 'Language Codes', {
      originalSource: document.querySelector('#sourceLanguage')?.value,
      normalizedSource: sourceLang,
      originalTarget: document.querySelector('#targetLanguage')?.value,
      normalizedTarget: targetLang
    });
    
    // 验证目标语言是否受支持
    if (!this.isLanguageSupported(targetLang)) {
      targetTextArea.value = `翻译失败: 不支持的目标语言代码 "${targetLang}"`;
      this.showNotification(`不支持的目标语言代码: ${targetLang}`);
      return;
    }
    
    // 验证源语言是否受支持（如果不是自动检测）
    if (sourceLang !== 'auto' && !this.isLanguageSupported(sourceLang)) {
      targetTextArea.value = `翻译失败: 不支持的源语言代码 "${sourceLang}"`;
      this.showNotification(`不支持的源语言代码: ${sourceLang}`);
      return;
    }

    try {
      targetTextArea.value = '正在翻译...';
      
      // 验证API密钥格式 - 允许更灵活的格式
      if (!this.apiKey || this.apiKey.length < 10) {
        throw new Error('Invalid API key format');
      }

      // 构建请求URL
      // 处理自动检测语言的情况，微软翻译API不接受'auto'作为源语言
      let fromParam = '';
      if (sourceLang && sourceLang !== 'auto') {
        fromParam = `&from=${sourceLang}`;
      }
      const requestUrl = `${this.endpoint}?api-version=3.0${fromParam}&to=${targetLang}`;
      
      this.logDebug('info', 'Language Settings', {
        sourceLang: sourceLang || 'auto (detection)',
        targetLang: targetLang,
        fromParam: fromParam,
        url: requestUrl
      });
      
      // 构建请求头
      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Ocp-Apim-Subscription-Region': this.region, // 使用配置的区域
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // 构建请求体
      const body = JSON.stringify([{ 'Text': sourceText }]);
      
      // 打印请求信息到控制台
      this.logDebug('info', 'API Request', {
        url: requestUrl,
        method: 'POST',
        headers: {...headers, 'Ocp-Apim-Subscription-Key': '******' }, // 隐藏实际API密钥
        body: body
      });
      
      // 记录请求开始时间
      const startTime = Date.now();
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: body
      });
      
      // 计算请求耗时
      const requestTime = Date.now() - startTime;

      // 打印响应状态
      this.logDebug('info', 'API Response', {
        status: response.status,
        statusText: response.statusText,
        time: `${requestTime}ms`
      });
      
      // 详细的错误处理
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Translation API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      
      // 打印响应数据（不含敏感信息）
      this.logDebug('info', 'API Response Data', data);
      
      // 验证响应数据结构
      if (!Array.isArray(data) || !data.length) {
        throw new Error('Invalid response format');
      }

      const translation = data[0]?.translations?.[0]?.text;
      if (!translation) {
        throw new Error('No translation result');
      }

      targetTextArea.value = translation;
      
    } catch (error) {
      this.logDebug('error', 'Translation Error', error);
      
      // 根据错误类型提供具体的错误信息
      let errorMessage = '翻译失败: ';
      if (error.message.includes('Invalid API key')) {
        errorMessage += 'API密钥格式无效，请检查配置';
      } else if (error.message.includes('401')) {
        errorMessage += 'API密钥无效或已过期';
      } else if (error.message.includes('403')) {
        errorMessage += 'API密钥无权限';
      } else if (error.message.includes('429')) {
        errorMessage += '请求过于频繁，请稍后再试';
      } else if (error.message.includes('400035') || error.message.includes('source language is not valid')) {
        errorMessage += '源语言代码无效，已尝试自动修复';
        // 尝试自动修复
        const sourceLanguage = document.querySelector('#sourceLanguage');
        if (sourceLanguage) {
          const originalValue = sourceLanguage.value;
          const normalizedValue = this.normalizeLanguageCode(originalValue);
          if (normalizedValue !== originalValue) {
            sourceLanguage.value = normalizedValue;
            this.showNotification(`已自动将源语言从 ${originalValue} 修正为 ${normalizedValue}`);
            // 自动重试翻译
            setTimeout(() => this.translate(), 500);
          } else if (sourceLanguage.value === 'auto') {
            sourceLanguage.value = 'en'; // 默认切换到英语
            this.showNotification('已自动切换到英语作为源语言');
            // 自动重试翻译
            setTimeout(() => this.translate(), 500);
          }
        }
      } else if (error.message.includes('400036') || error.message.includes('target language is not valid')) {
        errorMessage += '目标语言代码无效，请选择其他语言';
      } else if (error.message.includes('Invalid response format')) {
        errorMessage += 'API响应格式异常';
      } else if (error.message.includes('No translation result')) {
        errorMessage += '未获得翻译结果';
      } else if (!navigator.onLine) {
        errorMessage += '网络连接已断开';
      } else {
        errorMessage += '请检查网络连接和API配置';
      }
      
      targetTextArea.value = errorMessage;
      this.showNotification(errorMessage);
    }
  }

  async copyTranslation() {
    const text = document.querySelector('#targetText')?.value;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  }

  speakTranslation() {
    const text = document.querySelector('#targetText')?.value;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = document.querySelector('#targetLanguage')?.value;
    // 语音合成API使用的是标准语言代码，需要特殊处理中文等语言
    let speechLang = targetLang;
    if (targetLang === 'zh-Hans') {
      speechLang = 'zh-CN';
    } else if (targetLang === 'zh-Hant') {
      speechLang = 'zh-TW';
    }
    utterance.lang = speechLang || 'en';
    speechSynthesis.cancel(); // 停止当前朗读
    speechSynthesis.speak(utterance);
  }

  showApiConfig() {
    // 不要在控制台打印API密钥
    const apiKey = prompt('请输入Microsoft Translator API密钥 (格式: 密钥@区域，例如: abc123@eastasia):', this.apiKey);
    if (apiKey !== null) {
      // 移除可能的空格
      const trimmedKey = apiKey.trim();
      
      // 处理可能包含区域信息的API密钥
      let finalKey = trimmedKey;
      let region = 'eastasia'; // 默认区域
      
      // 检查是否包含 @ 符号，表示用户提供了区域信息
      if (trimmedKey.includes('@')) {
        const parts = trimmedKey.split('@');
        if (parts.length === 2) {
          finalKey = parts[0].trim();
          region = parts[1].trim();
          
          // 保存区域信息
          chrome.storage.sync.set({ translatorRegion: region });
          this.logDebug('info', 'Config Update', { region: region });
        }
      }
      
      // 验证API密钥格式
      if (finalKey.length < 10) {
        alert('API密钥格式可能不正确。请确保输入了完整的密钥。\n格式建议: 密钥@区域，例如: abc123@eastasia');
        // 仍然保存用户输入，但给出警告
      }
      
      this.apiKey = finalKey;
      this.region = region;
      chrome.storage.sync.set({ translatorApiKey: finalKey });
      
      // 如果用户输入了新的API密钥，测试其有效性
      if (trimmedKey && trimmedKey !== this.apiKey) {
        this.showNotification('API密钥已更新，正在测试...');
        this.testApiKey(trimmedKey);
      }
    }
  }
  
  /**
   * 测试API密钥是否有效
   * @param {string} apiKey - 要测试的API密钥
   */
  async testApiKey(apiKey) {
    if (!apiKey) return;
    
    this.isTestingApi = true;
    
    try {
      // 使用一个简单的测试文本
      const testText = 'Hello';
      
      // 构建请求URL和参数 - 使用明确的语言代码进行测试
      const testSourceLang = 'en';
      const testTargetLang = 'zh-Hans';
      const requestUrl = `${this.endpoint}?api-version=3.0&from=${testSourceLang}&to=${testTargetLang}`;
      const headers = {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': this.region,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      const body = JSON.stringify([{ 'Text': testText }]);
      
      // 打印API测试请求信息
      this.logDebug('info', 'API Key Test Request', {
        url: requestUrl,
        method: 'POST',
        headers: {...headers, 'Ocp-Apim-Subscription-Key': '******' }, // 隐藏实际API密钥
        body: body
      });
      
      const startTime = Date.now();
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: body
      });
      
      const requestTime = Date.now() - startTime;
      
      // 打印响应状态
      this.logDebug('info', 'API Key Test Response', {
        status: response.status,
        statusText: response.statusText,
        time: `${requestTime}ms`
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data) && data.length && data[0]?.translations?.[0]?.text) {
        this.showNotification('API密钥有效 ✓');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      this.logDebug('error', 'API Key Test Failed', error);
      
      let errorMessage = 'API密钥测试失败: ';
      if (error.message.includes('401')) {
        errorMessage += 'API密钥无效';
      } else if (error.message.includes('403')) {
        errorMessage += 'API密钥无权限';
      } else {
        errorMessage += '请检查密钥格式和网络连接';
      }
      
      this.showNotification(errorMessage);
    } finally {
      this.isTestingApi = false;
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }, 100);
  }

  initContextMenu() {
    // 创建菜单项，如果已存在则会自动更新
    try {
      chrome.contextMenus?.create({
        id: 'translateSelection',
        title: '翻译选中文本',
        contexts: ['selection']
      }, () => {
        // 捕获可能的错误
        if (chrome.runtime.lastError) {
          this.logDebug('warn', 'Context Menu', 'Menu item already exists or other error occurred');
        }
      });
    } catch (e) {
      this.logDebug('error', 'Context Menu', e);
    }

    chrome.contextMenus?.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'translateSelection') {
        const sourceText = document.querySelector('#sourceText');
        if (sourceText) {
          sourceText.value = info.selectionText;
          this.translate();
        }
      }
    });
  }
}

// 导出模块
export default TranslateTool;