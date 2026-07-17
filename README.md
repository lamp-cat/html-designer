# HTML Designer

HTML Designer 是一个本地优先的可视化 HTML 工作台。它面向独立 HTML 文档：打开文件后，可以直接在渲染画布上选择元素、修改文字和样式、插入组件，也可以切换到源码模式完成精确编辑。

## 主要能力

- 可视化选择、文字编辑、复制、删除、自由移动、调整顺序和尺寸。
- 24 个内置组件，覆盖文字、布局、组件、媒体、列表、表单、导航和数据展示，支持拖放、单击插入和快速插入面板。
- 可折叠 DOM 结构树、三段落点拖拽重排、组件搜索和可复用片段。
- 带元素摘要、实时尺寸与可视化盒模型的样式、属性、交互和局部 HTML 检查器。
- Visual/Source 双模式编辑。
- File System Access API 直接写回本地文件。
- 无写入权限时下载导出 HTML。
- 磁盘版本与编辑器内容并排比较。
- 桌面、平板和手机画布宽度、实时画布尺寸，以及 50%–150% 画布缩放和适应窗口。
- 可收起的组件/检查器面板、选中元素快捷工具条和自定义工具提示。
- `Ctrl/⌘ + K` 命令面板、`I` 快速插入、快捷键速查、HTML/选择器一键复制。
- 安全的编辑画布与可运行脚本的外部预览。
- 本地草稿自动保存和 36 步可视化历史。
- 通过本机 Codex CLI 或 Claude Code CLI 使用 AI Design。

## 启动

要求 Node.js 18 或更高版本。

```bash
npm start
```

默认地址：`http://localhost:4173/`。

macOS 和 Windows 也可以分别双击：

- `start-mac.command`
- `start-windows.bat`

一键启动脚本默认使用 `http://localhost:4175/`。

## AI Design

AI Design 通过 `server.js` 调用本机 CLI，不在浏览器内保存 API Key。使用前需要安装并登录以下任意一种工具：

- Codex CLI
- Claude Code CLI

可选环境变量：

```bash
HTML_DESIGNER_AGENT_CLI=codex
HTML_DESIGNER_AGENT_MODEL=
HTML_DESIGNER_AGENT_TIMEOUT_MS=180000
```

## 浏览器支持

- Chrome、Edge、Arc：支持打开文件并直接保存回磁盘。
- Safari、Firefox：支持导入、编辑和下载导出；不支持直接写回。

编辑画布使用不含 `allow-scripts` 的 sandbox，导入页面中的 JavaScript 不会在编辑状态执行。需要测试脚本时，请使用“外部预览”。

## 项目结构

```text
index.html              应用入口与完整工作台结构
css/studio.css          主题、布局、画布与面板样式
css/studio-polish.css   品牌、图标、动效和增强交互样式
js/studio-app.js        状态、画布、文件、检查器、组件库和 AI 客户端
logo-mark.svg           HTML Designer 矢量品牌标志与站点图标
server.js               静态服务器与本机 CLI 桥接
HTML_DESIGNER_USER_GUIDE.md
                        中文详细使用手册
```

核心前端使用原生 ES Module，没有构建步骤和运行时 npm 依赖。

## 隐私

普通编辑发生在浏览器中。AI Design 会把当前 HTML 和指令发送给本机 CLI；CLI 是否连接远程模型服务取决于其自身配置。

## License

[MIT](LICENSE) © 2026 lamp-cat
