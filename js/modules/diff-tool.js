// 文件对比工具模块
export function initDiffTool() {
    const diffEditorContainer = document.getElementById('diffEditor');
    const originalFileBtn = document.getElementById('originalFileBtn');
    const modifiedFileBtn = document.getElementById('modifiedFileBtn');
    const originalFilePath = document.getElementById('originalFilePath');
    const modifiedFilePath = document.getElementById('modifiedFilePath');
    
    let originalModel = null;
    let modifiedModel = null;
    let diffEditor = null;

    // 确保 Monaco 编辑器加载完成
    function initializeMonaco() {
        return new Promise((resolve, reject) => {
            try {
                // 如果monaco已经加载完成，直接返回
                if (typeof monaco !== 'undefined' && monaco.editor) {
                    resolve();
                    return;
                }

                // 配置Monaco环境
                window.MonacoEnvironment = {
                    getWorkerUrl: function(workerId, label) {
                        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                            self.MonacoEnvironment = {
                                baseUrl: '${window.location.origin}'
                            };
                            self.importScripts('${window.location.origin}/js/lib/monaco-editor/monaco.min.js');`
                        )}`;
                    }
                };

                // 加载Monaco编辑器脚本
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('js/lib/monaco-editor/monaco.min.js');
                script.async = true;
                script.defer = true;

                script.onload = () => {
                    // 确保monaco对象已经初始化
                    const checkMonaco = setInterval(() => {
                        if (typeof monaco !== 'undefined' && monaco.editor) {
                            clearInterval(checkMonaco);
                            clearTimeout(timeout);
                            resolve();
                        }
                    }, 50);

                    // 设置超时
                    const timeout = setTimeout(() => {
                        clearInterval(checkMonaco);
                        reject(new Error('Monaco editor failed to initialize after timeout'));
                    }, 5000);
                };

                script.onerror = () => {
                    reject(new Error('Failed to load Monaco editor script'));
                };

                // 如果脚本已存在，先移除
                const existingScript = document.querySelector('script[src*="monaco.min.js"]');
                if (existingScript) {
                    existingScript.remove();
                }

                document.head.appendChild(script);

            } catch (error) {
                reject(error);
            }
        });
    }

    // 初始化编辑器
    async function setupEditor() {
        try {
            console.log('Starting Monaco editor initialization...');
            await initializeMonaco();
            console.log('Monaco editor script loaded successfully');
            
            // 等待DOM元素准备就绪
            if (!diffEditorContainer) {
                throw new Error('Diff editor container not found');
            }

            // 创建两个初始模型
            originalModel = monaco.editor.createModel('// 原始文件内容', 'javascript');
            modifiedModel = monaco.editor.createModel('// 修改后的文件内容', 'javascript');
            
            console.log('Models created successfully');

            // 创建差异编辑器
            diffEditor = monaco.editor.createDiffEditor(diffEditorContainer, {
                automaticLayout: true,
                renderSideBySide: true,
                readOnly: false,
                theme: 'vs-dark', // 使用深色主题
                minimap: { enabled: false }, // 禁用小地图
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                contextmenu: true
            });
            
            // 设置编辑器的模型
            diffEditor.setModel({
                original: originalModel,
                modified: modifiedModel
            });

            console.log('Monaco Editor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
        }
    }

    // 启动编辑器初始化
    setupEditor();
    
    // 创建文件选择处理函数
    function createFileSelector(pathElement, isOriginal = true) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.js,.css,.html,.json,.md,.xml,.yaml,.yml,.ini,.conf,.log,.csv,.sql';
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                pathElement.value = file.name; // 显示文件名
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    const language = detectLanguage(file.name);
                    const model = monaco.editor.createModel(content, language);
                    
                    if (isOriginal) {
                        originalModel = model;
                    } else {
                        modifiedModel = model;
                    }
                    
                    if (originalModel && modifiedModel) {
                        diffEditor.setModel({
                            original: originalModel,
                            modified: modifiedModel
                        });
                    }
                };
                reader.readAsText(file);
            }
        });
        return fileInput;
    }
    
    // 设置原始文件选择按钮事件
    originalFileBtn.addEventListener('click', function() {
        const fileInput = createFileSelector(originalFilePath, true);
        fileInput.click();
    });
    
    // 设置对比文件选择按钮事件
    modifiedFileBtn.addEventListener('click', function() {
        const fileInput = createFileSelector(modifiedFilePath, false);
        fileInput.click();
    });
    
    // 根据文件扩展名检测语言
    function detectLanguage(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'sql': 'sql',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        
        return languageMap[extension] || 'plaintext';
    }
    
    return diffEditor;
}