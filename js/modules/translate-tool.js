// 翻译工具模块
class TranslateTool {
  constructor() {
    this.apiKey = '';
    this.endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    this.debounceTimer = null;
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.bindEvents();
    this.initContextMenu();
  }

  async loadConfig() {
    const config = await chrome.storage.sync.get(['translatorApiKey', 'defaultTargetLang']);
    this.apiKey = config.translatorApiKey || '';
    this.defaultTargetLang = config.defaultTargetLang || 'en';
    
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
        if (sourceLanguage.value === 'auto') return;
        const temp = sourceLanguage.value;
        sourceLanguage.value = targetLanguage.value;
        targetLanguage.value = temp;
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
          console.error('粘贴失败:', err);
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
    if (!this.apiKey) {
      this.showApiConfig();
      return;
    }

    const sourceText = document.querySelector('#sourceText')?.value.trim();
    if (!sourceText) return;

    const sourceLang = document.querySelector('#sourceLanguage')?.value;
    const targetLang = document.querySelector('#targetLanguage')?.value;
    const targetTextArea = document.querySelector('#targetText');

    if (!targetTextArea) return;

    try {
      targetTextArea.value = '正在翻译...';
      const response = await fetch(`${this.endpoint}?api-version=3.0&from=${sourceLang}&to=${targetLang}`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ 'Text': sourceText }])
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translation = data[0]?.translations[0]?.text;

      if (translation) {
        targetTextArea.value = translation;
      } else {
        throw new Error('No translation result');
      }
    } catch (error) {
      console.error('Translation error:', error);
      targetTextArea.value = '翻译失败，请检查API配置或网络连接';
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
    utterance.lang = document.querySelector('#targetLanguage')?.value || 'en';
    speechSynthesis.cancel(); // 停止当前朗读
    speechSynthesis.speak(utterance);
  }

  showApiConfig() {
    const apiKey = prompt('请输入Microsoft Translator API密钥:', this.apiKey);
    if (apiKey !== null) {
      this.apiKey = apiKey;
      chrome.storage.sync.set({ translatorApiKey: apiKey });
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
    chrome.contextMenus?.create({
      id: 'translateSelection',
      title: '翻译选中文本',
      contexts: ['selection']
    });

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