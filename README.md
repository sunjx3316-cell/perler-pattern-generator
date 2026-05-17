# 拼豆图纸生成器 (Perler Bead Pattern Generator)

这是一个完全在浏览器中运行的轻量级 Web 工具，可以将任意图片一键转换为拼豆图纸（像素画）。无论是为 Perler、Hama 还是 Artkal 拼豆制作图纸，本工具都能提供丰富的颜色匹配和参数调整功能，并支持直接导出带有颜色编号和网格的图纸。

## ✨ 核心功能 (Features)

- **图像处理与转换**：支持 JPG, PNG, GIF 格式。自动缩放、像素化，并支持调整亮度、对比度和饱和度。
- **多品牌色板支持**：内置多种常见拼豆品牌色板库：
  - 通用拼豆 (A-H 色号系统)
  - Perler (标准 P系列)
  - Hama (Midi)
  - Artkal (S系列)
- **高级色彩匹配**：支持 RGB/LAB 色彩空间匹配，以及可选的抖动（Dithering）算法，提升色彩过渡和细节还原度。
- **背景去除**：提供魔棒工具（Magic Wand）及透明背景处理，轻松抠除不需要的背景。
- **实时预览与辅助线**：
  - 支持显示/隐藏基础网格和参考大网格。
  - 支持显示色号和坐标，方便制作时的定位。
- **材料清单 (BOM)**：自动统计所选图像中使用的各颜色豆子数量。
- **导出与打印**：
  - **导出为图片 (PNG)**：生成带坐标、色号图例及用量表的清晰图片。
  - **导出为 PDF**：方便直接用 A4 纸打印的 PDF 格式。

## 🚀 快速开始 (Getting Started)

由于本项目是纯前端实现，无需复杂的环境配置。

1. **直接运行**：
   将本仓库克隆或下载到本地，双击在浏览器中打开 `index.html` 即可使用。

2. **单文件版本构建**：
   为了方便分享和离线使用，项目提供了一个 Python 脚本，可将 HTML、CSS 和 JS 资源打包成一个独立的 `.html` 文件：
   ```bash
   python build_dist.py
   ```
   运行后，将在当前目录生成 `dist.html`。你只需要发送这一个文件，其他人即可直接打开使用。

## 📂 项目结构 (Project Structure)

```text
├── index.html        # 主页面 UI 结构
├── app.js            # 核心逻辑 (图像处理, 色彩量化, 导出等)
├── colors.js         # 色板数据库
├── style.css         # 自定义样式表
├── build_dist.py     # 单文件打包脚本
└── dist.html         # 打包生成的单文件 (运行 build_dist.py 后产生)
```

## 🛠️ 技术栈 (Tech Stack)

- **HTML5 Canvas**: 用于图像的像素化处理和预览渲染。
- **Vanilla JavaScript**: 无需构建工具（Webpack/Vite 等），原生实现所有逻辑。
- **Tailwind CSS**: 通过 CDN 引入，用于快速构建现代化、响应式的用户界面。
- **jsPDF**: 用于前端生成和导出 PDF 图纸。

## 📝 许可证 (License)

MIT License
## https://sunjx3316-cell.github.io/perler-pattern-generator/
这个是应用链接，可点击直用。
