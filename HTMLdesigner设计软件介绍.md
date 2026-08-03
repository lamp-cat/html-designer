# HTML Designer

HTML Designer 是一个本地优先的可视化 HTML 工作台。它面向独立 HTML 文档：打开文件后，可以在编辑画布选择元素、修改文字和样式、插入组件，在浏览画布运行页面交互，也可以切换到源码模式完成精确编辑。

## 主要能力

- 可视化选择、文字编辑、复制、删除、PPT 式自由拖动、坐标微调、结构排序和尺寸调整。
- 24 个内置组件，覆盖文字、布局、组件、媒体、列表、表单、导航和数据展示，支持拖放、单击插入和快速插入面板。
- 可折叠 DOM 结构树、三段落点拖拽重排、组件搜索和可复用片段。
- 带元素摘要、自由位置坐标、实时尺寸与可视化盒模型的样式、属性、交互和局部 HTML 检查器。
- 编辑/浏览/源码三模式：编辑模式操作 DOM，浏览模式运行页面交互，源码模式精确修改完整 HTML。
- File System Access API 直接写回本地文件。
- 无写入权限时下载导出 HTML。
- 磁盘版本与编辑器内容并排比较。
- 桌面、平板和手机固定画板、25%–150% 缩放、视口适应和完整页面画板。
- 可收起的组件/检查器面板、选中元素快捷工具条和自定义工具提示。
- `Ctrl/⌘ + K` 命令面板、`I` 快速插入、快捷键速查、HTML/选择器一键复制。
- 安全的编辑画布、隔离且可运行脚本的浏览画布，以及新标签页外部预览。
- 新建文档使用纯独立的 Signal House 示例网站，不包含产品自身界面内容。
- IndexedDB 多文档草稿自动保存和 36 步可视化历史。
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

连接设置中的“模型”会随 CLI 自动刷新：Codex 读取 CLI 原生模型目录，Claude Code 读取当前 CLI 公布的模型别名和本机模型配置，并保留手动模型 ID 入口。“测试连接”会发送一次最小真实请求，验证版本、授权和模型链路。备用 CLI 切换默认关闭；需要时可以在连接设置中明确开启。

可选环境变量：

```bash
HTML_DESIGNER_AGENT_CLI=codex
HTML_DESIGNER_AGENT_MODEL=
HTML_DESIGNER_AGENT_TIMEOUT_MS=180000
HTML_DESIGNER_AGENT_PROBE_TIMEOUT_MS=60000
HTML_DESIGNER_AGENT_OUTPUT_LIMIT=8000000
HTML_DESIGNER_MODEL_CATALOG_TTL_MS=300000
HTML_DESIGNER_MAX_CONCURRENT_AI=1
```

## 浏览器支持

- Chrome、Edge、Arc：支持打开文件并直接保存回磁盘。
- Safari、Firefox：支持导入、编辑和下载导出；不支持直接写回。

编辑画布会把页面脚本和内联事件转成可逆的惰性占位，并叠加编辑态 CSP，因此导入页面的 JavaScript 不会在编辑状态执行，编辑器自身的选择与拖动事件仍可正常工作。切换到“浏览”后，当前 HTML 会通过消息通道送入不含 `allow-same-origin` 的独立 sandbox；新标签页预览也通过同样的隔离画布运行。

单文件工作流无法自动取得原项目目录权限。文档包含相对图片、样式、脚本或链接且没有绝对 `<base href>` 时，载入后会给出路径提示；发布前应设置正确的基址、改用绝对 URL/内联资源，或通过原项目服务器检查。

## 项目结构

```text
index.html              应用入口与完整工作台结构
guide.html              可搜索、可导航的使用指南页面
css/studio.css          主题、布局、画布与面板样式
css/studio-polish.css   品牌、图标、动效和增强交互样式
css/guide.css           使用指南的阅读布局与响应式样式
js/studio-app.js        状态、画布、文件、检查器、组件库和 AI 客户端
js/guide.js             Markdown 渲染、目录、搜索与指南交互
logo-mark.svg           HTML Designer 矢量品牌标志与站点图标
server.js               静态服务器与本机 CLI 桥接
HTML_DESIGNER_USER_GUIDE.md
                        中文详细使用手册
```

核心前端使用原生 ES Module，没有构建步骤和运行时 npm 依赖。

## 隐私

普通编辑发生在浏览器中。本地服务只监听回环地址，API 需要当前页面会话令牌，CLI 运行在独立临时目录。AI Design 会把当前 HTML 和指令发送给本机 CLI；CLI 是否连接远程模型服务取决于其自身配置。AI 返回候选内容后需要先查看变更摘要并确认，才会写入编辑历史。

## License

[MIT](LICENSE) © 2026 lamp-cat
