# DevToolKit - 开发者工具集

![DevToolKit Logo](images/icon128.png)

## 项目概述

DevToolKit 是一款为开发者设计的浏览器扩展工具集，集成了多种实用开发工具，帮助开发者提高工作效率。通过简洁直观的界面，开发者可以快速访问各种常用功能，无需在多个工具之间切换。

## 主要功能

### 1. JSON 格式化工具
- 一键格式化 JSON 数据
- 支持 JSON 压缩
- 语法高亮显示

### 2. 时间戳转换工具
- 支持秒、毫秒、微秒单位转换
- 显示本地时间、UTC 时间和 ISO 8601 格式
- 实时转换

### 3. 文件对比工具
- 支持两个文件的内容对比
- 直观显示差异
- 支持合并差异

### 4. 数据可视化工具
- 支持柱状图、折线图、饼图、散点图等多种图表类型
- 导入数据自动生成图表
- 支持图表导出

### 5. HTML转PDF工具
- 将网页内容转换为PDF文档
- 自定义PDF设置
- 实时预览

### 6. 智能取色器
- 获取网页元素颜色
- 显示HEX、RGB、HSL格式
- 颜色历史记录

### 7. 智能翻译工具
- 基于微软翻译API的多语言互译解决方案
- 支持108种语言互译与自动语种检测
- 检测置信度显示
- 实时翻译与批量翻译
- 语音输入与文本朗读
- 划词翻译（右键菜单）

### 8. 智能截图工具
- 网页区域自由选择截图
- 强大的图片编辑功能：
  - 绘制箭头、直线、矩形、圆形等形状
  - 添加自定义文字（支持多种字体）
  - 马赛克和模糊效果
- 完整的编辑历史（支持撤销/重做）
- 多种导出选项：
  - 一键复制到剪贴板
  - 保存为PNG/JPEG/PDF格式
  - OCR文字识别功能
- 自定义设置：
  - 多种颜色选择
  - 可调整线条粗细
  - 文字字体设置

## 安装方法

### 从浏览器应用商店安装
1. 访问 [Chrome 网上应用店](https://chrome.google.com/webstore)
2. 搜索 "DevToolKit"
3. 点击 "添加到 Chrome"

### 开发模式安装
1. 下载本仓库代码
2. 打开浏览器的扩展管理页面
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

## 使用指南

### JSON 格式化工具
1. 在输入框中粘贴 JSON 文本
2. 点击"格式化"按钮进行格式化
3. 可选择"压缩"或"复制"操作

### 时间戳转换工具
1. 输入时间戳数值
2. 选择时间戳单位（秒/毫秒/微秒）
3. 查看转换后的各种时间格式

### 文件对比工具
1. 点击"加载文件"按钮上传两个文件
2. 查看文件差异对比
3. 可选择"合并差异"操作

### 数据可视化工具
1. 点击"导入数据"按钮上传数据文件
2. 选择图表类型
3. 查看生成的图表，可选择"导出图表"

### HTML转PDF工具
1. 输入网页URL
2. 点击"转换"按钮
3. 预览并下载生成的PDF文件

### 智能取色器
1. 点击工具启动取色器
2. 在网页上选择要获取颜色的元素
3. 查看颜色的HEX、RGB、HSL值

### 智能翻译工具
1. 在输入框中输入要翻译的文本
2. 选择源语言和目标语言（或使用自动检测）
3. 查看翻译结果
4. 可使用语音输入、文本朗读、批量翻译等功能
5. 网页中选中文本，右键菜单选择"翻译选中文本"

### 智能截图工具
1. 点击工具栏图标或使用快捷键启动截图
2. 在网页上拖动选择要截图的区域
3. 在截图编辑器中：
   - 使用各种绘图工具（箭头、线条、形状等）
   - 添加文字说明
   - 应用马赛克或模糊效果
   - 使用撤销/重做管理修改
4. 导出选项：
   - 点击"复制"将图片复制到剪贴板
   - 点击"OCR"识别图片中的文字
   - 点击"保存"选择导出格式（PNG/JPEG/PDF）

## 配置说明

### 翻译工具配置
1. 点击"配置API"按钮
2. 输入Microsoft Translator API密钥
3. 密钥将安全存储在浏览器中

## 技术栈

- HTML5 / CSS3 / JavaScript
- Monaco Editor (代码编辑器)
- ECharts (数据可视化)
- Web Speech API (语音输入/输出)
- Microsoft Translator API (翻译服务)
- Chrome Extension API

## 隐私说明

DevToolKit 尊重用户隐私，所有数据处理均在本地完成，不会将用户数据上传至任何服务器（除非明确授权，如翻译API）。API密钥等敏感信息使用浏览器的安全存储机制加密保存。

## 许可证

[MIT License](LICENSE)

## 联系方式

如有问题或建议，请通过以下方式联系我们：
- 电子邮件：52450909@qq.com
- GitHub Issues：[提交问题](https://github.com/example/devtoolkit/issues)

---

© 2023 DevToolKit Team. All Rights Reserved.