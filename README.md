# Pen 简体中文静态汉化

为 Windows 版 [pen.dev](https://pen.dev/) 桌面应用提供简体中文固定界面文本。它直接更新 Pen 的 `app.asar` 资源包，不会在 Pen 运行时注入脚本。

当前支持：**Pen 1.2.10（Windows x64）**。

需要逐步操作说明，请查看：[操作教程](docs/TUTORIAL.md)。

## 汉化范围

已覆盖常用的固定界面：

- 顶部 File、Edit、View、Window、Help 菜单及绝大多数二级菜单。
- Dashboard、设置、工作区、导入导出、浏览器导入、组件库、设计库、字体、图层属性、评论、幻灯片和更新提示。
- 智能体、账号、服务商、连接和同步等固定说明文本。

以下内容会保持原样，避免影响功能或误改用户内容：

- `.pen` 文档名称、画布文字、图层名称、变量名称、文件路径、字体名称和用户输入。
- 模型、服务商、设备和产品品牌。
- `MCP`、`Hook`、`Token`、`API`、HTML、CSS、SVG、Figma、CLI 等技术词。
- Windows 文件选择器等系统界面，以及服务端动态返回的消息。

## 使用前准备

1. 在 Pen 的 **Help → About Pen** 确认版本为 **1.2.10**。
2. 安装 Node.js 18 或更高版本。安装后，在 PowerShell 中运行 `node --version`，能显示版本号即可。
3. 保存所有设计，然后**完全退出 Pen**。任务管理器中不应再有 `Pen.exe`。

> 脚本会为原版 `app.asar` 创建备份；不会上传、收集或包含你的设计文件。

## 三步安装

1. 下载本仓库 ZIP 并解压，或使用 Git 克隆仓库。
2. 在解压后的文件夹空白处按住 `Shift` 并右键，选择“在此处打开 PowerShell 窗口”。
3. 运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\Install-Chinese.ps1
```

看到“完成。现在可以启动 Pen。”后，重新打开 Pen。

默认安装目录为：

```text
C:\Users\你的用户名\AppData\Local\Programs\Pen\resources
```

如果 Pen 安装在其他位置，运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\Install-Chinese.ps1 -ResourcesPath 'D:\Apps\Pen\resources'
```

## 检查兼容性

更新 Pen 前后，可先运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\Verify-Compatibility.ps1
```

它只检查资源结构和版本，不写入任何文件。

## 恢复英文

完全退出 Pen 后，在本仓库目录运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\Restore-English.ps1
```

它会把首次安装时自动创建的原版备份恢复为 `app.asar`。

## Pen 更新后怎么办

Pen 更新通常会覆盖 `app.asar`。请先用 `Verify-Compatibility.ps1` 检查；若仍显示支持的版本，再关闭 Pen 并运行 `Install-Chinese.ps1`。

当前脚本只允许对 1.2.10 写入。如果版本不同，脚本会停止，不会修改 Pen。

## 工作原理

`scripts/apply-static-ui.cjs` 从原版备份读取 `menu.js` 和编辑器的 `index.js`，只替换经过人工筛选的固定界面字符串，再更新 ASAR 文件索引和 SHA-256 完整性数据。Pen 启动时加载的是已处理的资源包，因此没有常驻程序，也不会在每次启动时自动执行汉化。

仓库不包含 Pen 安装包、`app.asar`、原版备份或任何用户数据。

## 反馈

请在 Issue 中附上 Pen 版本、界面截图和复现步骤。不要上传含有私密设计内容、Token、API 密钥或用户文件路径的截图。
