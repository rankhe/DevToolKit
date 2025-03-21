// 数据可视化工具模块
import { isDarkMode } from './theme.js';
import { showNotification } from './notification.js';

let chart = null;
let currentChartType = 'bar';

// 图表示例数据
const chartSamples = {
    bar: [
        { name: '一月', value: 320 },
        { name: '二月', value: 450 },
        { name: '三月', value: 380 },
        { name: '四月', value: 560 },
        { name: '五月', value: 490 }
    ],
    line: [
        { name: '周一', value: 150 },
        { name: '周二', value: 230 },
        { name: '周三', value: 224 },
        { name: '周四', value: 218 },
        { name: '周五', value: 335 },
        { name: '周六', value: 247 },
        { name: '周日', value: 190 }
    ],
    pie: [
        { name: '搜索引擎', value: 335 },
        { name: '直接访问', value: 310 },
        { name: '邮件营销', value: 234 },
        { name: '联盟广告', value: 135 },
        { name: '视频广告', value: 148 }
    ],
    scatter: [
        { name: 'A', value: [10.0, 8.04] },
        { name: 'B', value: [8.07, 6.95] },
        { name: 'C', value: [13.0, 7.58] },
        { name: 'D', value: [9.05, 8.81] },
        { name: 'E', value: [11.0, 8.33] }
    ]
};

export function initChartTool() {
    const chartContainer = document.getElementById('chartPreview');
    const chartOptions = document.querySelectorAll('.chart-type-option');
    const importButton = document.getElementById('chartImport');
    const exportButton = document.getElementById('chartExport');
    
    // 图表类型选择事件
    chartOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            currentChartType = type;
            
            // 更新选中状态
            chartOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // 创建对应类型的示例图表
            createChart(chartSamples[type]);
        });
        
        // 示例按钮点击事件
        const sampleBtn = option.querySelector('.chart-sample-btn');
        sampleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = option.dataset.type;
            createChart(chartSamples[type]);
            showNotification('已加载示例数据');
        });
    });
    
    // 选中默认图表类型
    const defaultOption = document.querySelector(`.chart-type-option[data-type="${currentChartType}"]`);
    if (defaultOption) {
        defaultOption.classList.add('selected');
        createChart(chartSamples[currentChartType]);
    }
    
    // 导入数据按钮事件
    importButton.addEventListener('click', function() {
        // 创建一个文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        createChart(data);
                        showNotification('图表生成成功');
                    } catch (e) {
                        showNotification('数据格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        fileInput.click();
    });
    
    // 导出图表按钮事件
    exportButton.addEventListener('click', function() {
        if (chart) {
            const url = chart.getDataURL();
            const link = document.createElement('a');
            link.download = 'chart.png';
            link.href = url;
            link.click();
            showNotification('图表导出成功');
        } else {
            showNotification('没有可导出的图表', 'error');
        }
    });
    
    // 导出样例数据按钮事件
    const exportSampleButton = document.getElementById('exportSample');
    exportSampleButton.addEventListener('click', function() {
        const sampleData = chartSamples[currentChartType];
        const dataStr = JSON.stringify(sampleData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${currentChartType}-sample.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showNotification('样例数据导出成功');
    });
    
    function createChart(data) {
        if (chart) {
            chart.dispose();
        }
        
        chart = echarts.init(chartContainer, isDarkMode ? 'dark' : null);
        
        // 根据选择的图表类型创建配置
        const option = {
            title: {
                text: '数据可视化',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'normal'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: currentChartType === 'line' ? 'cross' : 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            series: []
        };

        // 根据图表类型配置不同的选项
        switch (currentChartType) {
            case 'bar':
            case 'line':
                option.xAxis = { data: data.map(item => item.name) };
                option.yAxis = {};
                option.series.push({
                    name: '数值',
                    type: currentChartType,
                    data: data.map(item => item.value)
                });
                break;
            case 'pie':
                option.series.push({
                    name: '数值',
                    type: 'pie',
                    data: data.map(item => ({
                        name: item.name,
                        value: item.value
                    }))
                });
                break;
            case 'scatter':
                option.xAxis = {
                    type: 'value',
                    name: 'X轴',
                    splitLine: {
                        lineStyle: {
                            type: 'dashed'
                        }
                    }
                };
                option.yAxis = {
                    type: 'value',
                    name: 'Y轴',
                    splitLine: {
                        lineStyle: {
                            type: 'dashed'
                        }
                    }
                };
                option.series.push({
                    name: '数据点',
                    type: 'scatter',
                    symbolSize: 12,
                    itemStyle: {
                        opacity: 0.8
                    },
                    data: data.map(item => [item.x || item.name, item.y || item.value])
                });
                break;
        }
        
        chart.setOption(option);
    }
    
    // 响应窗口大小变化
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize();
        }
    });
    
    return chart;
}