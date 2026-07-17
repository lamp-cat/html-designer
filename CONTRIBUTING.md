# Contributing to HTML Designer

感谢你参与 HTML Designer。

## 本地开发

```bash
npm start
```

访问 `http://localhost:4173/`。

前端没有编译步骤。修改 `index.html`、`css/studio.css` 或 `js/studio-app.js` 后刷新浏览器即可。

## 代码约定

- 使用原生现代 JavaScript 和 ES Module。
- 使用两空格缩进、单引号和分号。
- 新增交互必须同时考虑 Visual 与 Source 模式。
- 不在编辑 iframe 中启用 `allow-scripts`。
- 文件系统能力必须检测浏览器支持，并提供导入/导出退路。
- 新增 localStorage 数据必须使用 `html-designer.v1.*` 命名空间。
- 不提交密钥、访问令牌、用户 HTML 或自动保存内容。

## 添加组件

在 `js/studio-app.js` 的 `BLOCKS` 数组中增加定义：

```js
['组件分类', '组件名称', '显示符号', '<article>...</article>']
```

组件应包含一个顶层元素，并尽量使用语义 HTML。

## 验证

提交前至少运行：

```bash
node --check js/studio-app.js
node --check server.js
npm start
```

然后在真实浏览器中检查：

1. 新建页面。
2. 选择元素并修改样式。
3. 撤销和重做。
4. Visual/Source 往返切换。
5. 导出 HTML。
6. 外部预览。

如果修改了 File System Access 流程，请使用 Chromium 浏览器测试直接保存，同时使用不支持该 API 的浏览器验证导入/导出退路。

## Pull Request

请说明：

- 修改内容及原因。
- 用户可见影响。
- 验证方式。
- UI 改动截图或短视频。

每个 PR 尽量只处理一个明确主题。
