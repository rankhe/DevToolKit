var require = {
    paths: {
        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs'
    }
};

// 配置Monaco环境
window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
        return `https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/base/worker/workerMain.js`;
    }
};

// 确保monaco命名空间在全局可用
window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
                baseUrl: '${window.location.origin}'
            };
            importScripts('${window.location.origin}/js/lib/monaco-editor/editor.worker.js');`
        )}`;
    }
};