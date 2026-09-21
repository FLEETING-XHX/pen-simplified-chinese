// Static UI translation for Pen 1.2.10 and 1.2.13.
// It replaces literal UI labels in packed resources and never runs code inside
// the editor window. Canvas content, saved .pen files, fonts, and UI events
// are left untouched.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
if (args.includes('--help')) {
  console.log('Usage: node apply-static-ui.cjs [--pen-resources <path>] [--check] [--restore]');
  process.exit(0);
}
const defaultResourcesDir = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Pen', 'resources');
const requestedResourcesDir = valueAfter('--pen-resources') || process.env.PEN_RESOURCES_DIR || defaultResourcesDir;
if (args.includes('--pen-resources') && !valueAfter('--pen-resources')) throw new Error('Missing path after --pen-resources.');
const resourcesDir = path.resolve(requestedResourcesDir);
const asarPath = path.join(resourcesDir, 'app.asar');
const checkOnly = args.includes('--check');
const restoreOnly = args.includes('--restore');
if (!fs.existsSync(asarPath)) throw new Error(`Pen app.asar was not found: ${asarPath}`);
const activeArchive = fs.readFileSync(asarPath);
function readVersion(input) {
  const jsonLength = input.readUInt32LE(12);
  const dataStart = 8 + input.readUInt32LE(4);
  const header = JSON.parse(input.subarray(16, 16 + jsonLength).toString('utf8'));
  const entry = header.files?.['package.json'];
  if (!entry) throw new Error('Pen package metadata was not found; no files were changed.');
  const packageData = input.subarray(dataStart + Number(entry.offset), dataStart + Number(entry.offset) + entry.size);
  return JSON.parse(packageData.toString('utf8')).version || 'unknown';
}
const version = readVersion(activeArchive);
const supportedVersions = new Set(['1.2.10', '1.2.13']);
if (!supportedVersions.has(version)) {
  throw new Error(`Pen ${version} is not supported by this release. No files were changed.`);
}
const backupPath = path.join(resourcesDir, `app.asar.en-${version}.bak`);
if (restoreOnly) {
  if (!fs.existsSync(backupPath)) throw new Error(`Original backup was not found: ${backupPath}`);
  if (checkOnly) {
    console.log(`Original backup is available for Pen ${version}: ${backupPath}`);
    process.exit(0);
  }
  const tempPath = `${asarPath}.restore.tmp`;
  fs.copyFileSync(backupPath, tempPath);
  fs.renameSync(tempPath, asarPath);
  console.log(`Restored the original English Pen ${version} archive.`);
  process.exit(0);
}
// Rebuild from the original backup every time so vocabulary updates do not
// apply a second transformation to an existing localized archive.
const archive = fs.existsSync(backupPath) ? fs.readFileSync(backupPath) : activeArchive;
const oldJsonLength = archive.readUInt32LE(12);
const oldDataStart = 8 + archive.readUInt32LE(4);
const header = JSON.parse(archive.subarray(16, 16 + oldJsonLength).toString('utf8'));
const packageEntry = header.files?.['package.json'];
const editorFiles = header.files?.out?.files?.editor?.files;
const menuEntry = header.files?.out?.files?.['menu.js'];
const editorEntry = editorFiles?.assets?.files?.['index.js'];
if (!packageEntry || !menuEntry || !editorEntry) throw new Error(`Expected Pen ${version} resources were not found; no files were changed.`);

const oldData = archive.subarray(oldDataStart);
const originalEditor = archive.subarray(oldDataStart + Number(editorEntry.offset), oldDataStart + Number(editorEntry.offset) + editorEntry.size).toString('utf8');

const labels = new Map([
  // Canvas property panel
  ['Alignment', '对齐'], ['Position', '位置'], ['Layout', '布局'], ['Dimensions', '尺寸'],
  ['Appearance', '外观'], ['Fill', '填充'], ['Stroke', '描边'], ['Effects', '效果'],
  ['Fill Width', '填满宽度'], ['Fill Height', '填满高度'], ['Clip Content', '裁剪内容'],
  ['Opacity', '不透明度'], ['Rotation', '旋转'], ['Corner Radius', '圆角'], ['Radius', '圆角'],
  ['Position', '位置'], ['Weight', '粗细'], ['Join', '连接'], ['Cap', '端点'], ['Center', '居中'],
  ['Inside', '内部'], ['Outside', '外部'], ['Solid', '实线'], ['Dashed', '虚线'],
  ['Color', '颜色'], ['Width', '宽度'], ['Height', '高度'], ['X', 'X'], ['Y', 'Y'], ['W', '宽'], ['H', '高'], ['R', '旋转'],
  ['Auto', '自动'], ['Fixed', '固定'], ['Hug contents', '适应内容'], ['Fill container', '填满容器'],
  ['Horizontal', '水平'], ['Vertical', '垂直'], ['Gap', '间距'], ['Padding', '内边距'],
  ['Top', '顶部'], ['Right', '右侧'], ['Bottom', '底部'], ['Left', '左侧'],
  ['Layer', '图层'], ['Layers', '图层'], ['Assets', '资源'], ['Components', '组件'], ['Libraries', '库'],
  ['Text', '文本'], ['Image', '图片'], ['Icon', '图标'], ['Group', '组合'], ['Frame', '画板'],
  ['Page', '页面'], ['Pages', '页面'], ['Selection', '选择'], ['Export', '导出'],
  ['Export Settings', '导出设置'], ['Scale', '缩放'], ['Format', '格式'], ['Preview', '预览'],
  ['Typography', '文字排版'], ['Font', '字体'], ['Font Family', '字体'], ['Font Size', '字号'],
  ['Line Height', '行高'], ['Letter Spacing', '字间距'], ['Paragraph Spacing', '段落间距'],
  ['Text Align', '文本对齐'], ['Style', '样式'], ['Effects', '效果'], ['Blur', '模糊'],
  ['Shadow', '阴影'], ['Drop Shadow', '投影'], ['Inner Shadow', '内阴影'], ['Background Blur', '背景模糊'],
  ['Visible', '可见'], ['Hidden', '隐藏'], ['Locked', '已锁定'], ['Unlock', '解锁'], ['Lock', '锁定'],
  ['Add', '添加'], ['Remove', '移除'], ['Reset', '重置'], ['Close', '关闭'], ['Done', '完成'],
  ['Cancel', '取消'], ['Apply', '应用'], ['Search', '搜索'], ['Replace', '替换'],
  // Variables
  ['Theme', '主题'], ['Name', '名称'], ['Value', '值'], ['Add variable', '添加变量'],
  // Tool strip
  ['Agents', '智能体'], ['Rectangle', '矩形'], ['Ellipse', '椭圆'], ['Polygon', '多边形'],
  ['Line', '直线'], ['Script', '脚本'], ['Import Image', '导入图片'],
  ['Import Image or SVG…', '导入图片或 SVG…'], ['Import Image/SVG/Figma...', '导入图片/SVG/Figma…'],
  ['Import Figma', '导入 Figma'],
  // Dashboard and dialogs
  ['Recent', '最近使用'], ['Drafts', '草稿'], ['Templates', '模板'], ['Open File', '打开文件'],
  ['New File', '新建文件'], ['Create new file', '新建文件'], ['Open', '打开'], ['Save', '保存'],
  ['Save As', '另存为'], ['Delete', '删除'], ['Duplicate', '复制'], ['Rename', '重命名'],
  ['Settings', '设置'], ['Preferences', '偏好设置'], ['Keyboard Shortcuts', '键盘快捷键'],
  ['Account', '账户'], ['Sign in', '登录'], ['Sign out', '退出登录'], ['Update', '更新'],
  ['Check for Updates', '检查更新'],
  // Settings
  ['General', '常规'], ['Agent Names', '智能体名称'], ['Chat', '对话'],
  ['Light Mode', '浅色模式'], ['Dark Mode', '深色模式'], ['Show pixel grid', '显示像素网格'],
  ['Snap to pixel grid', '贴合像素网格'], ['Snap to objects', '贴合对象'],
  ['Use scroll wheel to zoom', '使用滚轮缩放'], ['Invert zoom direction', '反转缩放方向'],
  ['Hide sidebar when Layers are open', '打开图层时隐藏侧栏'],
  ['Animations & effects (turn off to save GPU/CPU)', '动画与效果（关闭可节省 GPU/CPU）'],
  ['Include HTML metadata when importing pages', '导入页面时包含 HTML 元数据'],
  ['Default image generation provider', '默认图片生成服务'],
  ['Agent chat text size', '智能体对话文字大小'], ['Agent cursor size', '智能体光标大小'],
  ['Agent cursor label', '智能体光标标签'], ['Show agent input on dashboard', '在仪表板显示智能体输入'],
  ['Small (Default)', '小（默认）'], ['Agent (Default)', '智能体（默认）'],
  // Document workspace popover and status
  ['Code gets generated to the workspace folder', '代码将生成到工作区文件夹'],
  ['Choose a folder where agent can generate code', '选择智能体生成代码的文件夹'],
  ["Workspace is this document's folder", '工作区是此文档所在文件夹'],
  ['Open Workspace Folder', '打开工作区文件夹'], ['Change Workspace…', '更改工作区…'],
  ['Set Workspace…', '设置工作区…'], [' — Auto-saved', ' — 已自动保存'],
  [' — Edited', ' — 已编辑'], [' — Read only', ' — 只读'],
  // Browser import and export
  ['Full Page', '整页'], ['Visible Area', '可见区域'], ['Preview Resolution', '预览分辨率'],
  ['Zoom In', '放大'], ['Zoom Out', '缩小'], ['Empty Cache and Reload', '清空缓存并重新加载'],
  ['Show DevTools', '显示开发者工具'], ['Pop Out to Separate Window', '在独立窗口中打开'],
  ['Dock Back into the Editor', '停靠回编辑器'], ['Back', '后退'], ['Forward', '前进'],
  ['Enter a URL', '输入 URL'], ['Open Folder', '打开文件夹'], ['Zoom and device settings', '缩放和设备设置'],
  ['More options', '更多选项'], ['Close Browser View', '关闭浏览器视图'],
  ['Drag to clip import height, double-click to import the full page', '拖动以裁剪导入高度，双击导入整页'],
  ['Import from the web', '从网页导入'],
  ['Open a live site or your localhost dev server, then bring it onto the canvas as editable layers.', '打开线上网站或本地开发服务器，再将其作为可编辑图层导入画布。'],
  ['Import the full page', '导入整页'], ['Import an element', '导入元素'], ['Import a screenshot', '导入截图'],
  ['Import Web via Browser', '通过浏览器导入网页'], ['Import from Browser', '从浏览器导入'],
  ['Include HTML scaffold', '包含 HTML 页面结构'], ['Ask user where to export the file', '导出时询问保存位置'],
  ['Open in Browser after Export', '导出后在浏览器中打开'], ['Include layer names', '包含图层名称'], ['Include layer IDs', '包含图层 ID'],
  ['Copy HTML', '复制 HTML'], ['Copy as HTML', '复制为 HTML'], ['Copy as HTML + CSS', '复制为 HTML + CSS'],
  ['Copy as HTML + Tailwind', '复制为 HTML + Tailwind'], ['Copy as JSON', '复制为 JSON'], ['Copy as PNG', '复制为 PNG'],
  ['Export all slides', '导出所有幻灯片'], ['Layers will be exported as pages in a single PDF. Pages are sorted in the order they were selected.', '图层将导出为一个 PDF 中的页面，并按选择顺序排列。'],
  // Selection, navigation, and contextual actions
  ['Bring to Front', '置于顶层'], ['Send to Back', '置于底层'], ['Bring forward', '上移一层'], ['Send backward', '下移一层'],
  ['Group selection', '组合所选内容'], ['Frame selection', '将所选内容设为画板'], ['Ungroup', '取消组合'],
  ['Create Component', '创建组件'], ['Create component', '创建组件'], ['Detach Component', '分离组件'],
  ['Detach instance', '分离实例'], ['Replace inside instance', '替换实例内部内容'], ['Go to component', '前往组件'],
  ['Make slot', '创建插槽'], ['Remove slot', '移除插槽'], ['Add flex layout', '添加弹性布局'], ['Remove flex layout', '移除弹性布局'],
  ['Flip horizontal', '水平翻转'], ['Flip vertical', '垂直翻转'], ['Align top', '顶部对齐'],
  ['Align left', '左对齐'], ['Align bottom', '底部对齐'], ['Align right', '右对齐'],
  ['Align center', '水平居中'], ['Align middle', '垂直居中'], ['Select all', '全选'], ['Deselect', '取消选择'],
  ['Select children', '选择子项'], ['Select parent', '选择父项'], ['Add to selection', '添加到选择'],
  ['Deep select', '深度选择'], ['Zoom to fit', '缩放以适应画布'], ['Zoom to selection', '缩放到所选内容'],
  ['Zoom in at pointer', '以指针位置放大'], ['Zoom out at pointer', '以指针位置缩小'], ['Zoom to region', '缩放到区域'],
  ['Pan horizontally', '水平平移'], ['Pan by dragging', '拖动平移'], ['Keyboard Shortcuts', '键盘快捷键'],
  // Components, libraries, variables, and resources
  ['Design Libraries', '设计库'], ['Your Libraries', '你的库'], ['Libraries by Pencil.dev', 'Pen 提供的库'],
  ['Turn this file into a library', '将此文件设为库'], ['Turn into a library', '设为库'],
  ['This file is a library', '此文件是一个库'], ['No components found', '未找到组件'],
  ['No components created yet.', '尚未创建组件。'], ['Select an element to create a component.', '选择一个元素以创建组件。'],
  ['Components serve as the foundation for building design systems.', '组件是构建设计系统的基础。'],
  ['Use existing', '使用现有项'], ['Add renamed', '添加重命名项'], ['Mixed themes', '混合主题'],
  ['Custom Fonts', '自定义字体'], ['Fonts added here are only available in this document.', '在此添加的字体仅在当前文档可用。'],
  ['Import custom fonts in .ttf, .otf, .woff, or .woff2 format.', '导入 .ttf、.otf、.woff 或 .woff2 格式的自定义字体。'],
  ['Local font files will be automatically copied next to your pen file.', '本地字体文件将自动复制到 .pen 文件旁。'],
  ['Font file path (.ttf, .otf, .woff, .woff2)', '字体文件路径（.ttf、.otf、.woff、.woff2）'],
  ['Add new font', '添加字体'], ['Search fonts...', '搜索字体…'], ['All Fonts', '所有字体'],
  ['Search icons...', '搜索图标…'], ['Search components...', '搜索组件…'], ['Script Gallery...', '脚本库…'], ['Shader Gallery...', '着色器库…'],
  // Properties and visual effects
  ['Flex grow', '弹性增长'], ['Flex shrink', '弹性收缩'], ['Flex basis', '弹性基准'],
  ['Flex direction', '弹性方向'], ['Justify content', '主轴对齐'], ['Align items', '交叉轴对齐'],
  ['Border color', '边框颜色'], ['Font family', '字体'], ['Font size', '字号'], ['Font weight', '字重'], ['Line height', '行高'],
  ['Copy all styles', '复制全部样式'], ['Grid Size', '网格大小'], ['Reset Position', '重置位置'], ['Reset Curve', '重置曲线'],
  ['Mixed effects', '混合效果'], ['Mixed fills', '混合填充'], ['Auto width', '自动宽度'], ['Auto height', '自动高度'],
  ['Fixed size', '固定尺寸'], ['Space Between', '两端分布'], ['Space Around', '环绕分布'],
  ['Padding Values', '内边距值'], ['One value for all sides', '四边使用同一数值'], ['Horizontal/Vertical', '水平/垂直'],
  ['Top/Right/Bottom/Left', '上/右/下/左'], ['Hug Width', '适应宽度'], ['Hug Height', '适应高度'],
  ['Absolute Position', '绝对定位'], ['Image path or URL', '图片路径或 URL'], ['Shader path or URL', '着色器路径或 URL'],
  // Comments, recovery, slides, and common feedback
  ['No comments yet', '暂无评论'], ['No open comments', '没有未关闭的评论'], ['Nothing resolved yet', '暂无已解决项目'],
  ['Sign in to comment', '登录后评论'], ['Try again', '重试'], ['Failed to load layer list.', '加载图层列表失败。'],
  ['Empty canvas. Draw something.', '画布为空，开始绘制吧。'], ['Failed to load Slides.', '加载幻灯片失败。'],
  ['No frames yet.', '暂无画板。'], ['Add frames to the canvas to see them here as slides. Frames appear in document order and can be reordered by dragging.', '在画布中添加画板后，它们会在此显示为幻灯片，并可拖动调整顺序。'],
  ['Recovered changes', '已恢复的更改'], ['pen.dev ran into a problem', 'Pen 遇到问题'],
  ['The error was reported automatically.', '错误已自动上报。'], ['Reload to keep working.', '重新加载以继续工作。'],
  ['Restart pen.dev if the problem continues.', '如果问题持续，请重启 Pen。'], ['No documents here yet', '这里还没有文档'],
  // Dialogs, menus, dashboard, and static descriptions
  ['Most capable, higher cost', '能力最强，成本较高'], ['Fast, balanced performance', '快速且性能均衡'],
  ['Fastest, lowest cost', '最快，成本最低'], ['Default (Responsive)', '默认（响应式）'],
  ['Export HTML', '导出 HTML'], ['No script file selected', '未选择脚本文件'],
  ['An internal error occurred', '发生内部错误'], ['All systems operational', '所有系统运行正常'],
  ['New Agent', '新建智能体'], ['Open settings…', '打开设置…'],
  ['pen.dev stopped unexpectedly last time. Your unsaved changes were restored from the last backup.', 'Pen 上次意外退出，未保存的更改已从最近备份中恢复。'],
  ['Clear All History', '清除全部历史记录'], ['New file', '新建文件'], ['Open file', '打开文件'],
  ['Pixel grid', '像素网格'], ['Comment markers', '评论标记'], ['Toggle chat', '切换对话'],
  ['New chat tab', '新建对话标签页'], ['Next chat tab', '下一个对话标签页'], ['Previous chat tab', '上一个对话标签页'],
  ['Prompt history', '提示词历史'], ['Context Usage', '上下文用量'],
  ['System prompt & tools derived from the reported context size.', '系统提示词与工具根据已报告的上下文大小生成。'],
  ['Missing dependencies', '缺少依赖项'], ['Clear All', '全部清除'], ['Run All', '全部运行'],
  ['Loading', '正在加载'], ['Unknown', '未知'], ['Quality', '质量'], ['Lossless', '无损'],
  ['High', '高'], ['Low', '低'], ['Featured', '精选'], ['Styles', '样式'],
  ['Design Systems', '设计系统'], ['More...', '更多…'], ['More…', '更多…'],
  ['No, paste verbatim copies', '否，粘贴独立副本'], ['Creating Components', '正在创建组件'],
  ['Select the element', '选择元素'], ['Using Components', '使用组件'], ['Convert to layers', '转换为图层'],
  ['Context information', '上下文信息'], ['Notifications', '通知'],
  ['Selected tab will be used for agent names.', '所选标签页将用于智能体名称。'],
  ['Pick names for your design agents', '为设计智能体选择名称'], ['You can also customize the names of your agents or do this later.', '你也可以稍后自定义智能体名称。'],
  ['Show usage', '查看用量'], ['View status', '查看状态'], ['Clear Agent History', '清除智能体历史记录'],
  ['Remove Agent History', '移除智能体历史记录'], ['Remove all', '全部移除'], ['Stop all agents', '停止所有智能体'],
  ['Stop agents', '停止智能体'], ['Stop current', '停止当前智能体'], ['Finished', '已完成'],
  ['Loading agent conversations…', '正在加载智能体对话…'],
  ['Hi, I am your design agent. Ask me to design something...', '你好，我是你的设计智能体。告诉我想设计什么…'],
  ['Pencil it out', '开始设计'], ['No organizations', '没有组织'], ['Current workspace', '当前工作区'],
  ['Import Snapshot', '导入快照'], ['Paste a snapshot URL to download and open it in Pencil.', '粘贴快照 URL 以下载并在 Pen 中打开。'],
  ['Snapshot URL', '快照 URL'], ['Select snapshot directory', '选择快照目录'],
  // More fixed controls, import, and editor feedback
  ['Cut', '剪切'], ['Copy', '复制'], ['Paste', '粘贴'], ['Delete', '删除'],
  ['The document contained duplicate identifiers', '文档中包含重复标识符'],
  ['Relative paths (in the repo...)', '相对路径（仓库内…）'], ['Absolute paths (on the disk)', '绝对路径（磁盘上）'],
  ['Embed assets (self-contained document)', '嵌入资源（自包含文档）'],
  ['No script file selected', '未选择脚本文件'], ['Permission Request', '权限请求'],
  ['Allow', '允许'], ['Deny', '拒绝'], ['Set Repository', '设置仓库'], ['Submit Answer', '提交回答'],
  ['Apply with AI', '使用 AI 应用'], ['Apply feedback to the targeted nodes', '将反馈应用到目标节点'],
  ['Apply with AI on copies', '在副本上使用 AI 应用'],
  ['Duplicate target nodes first, then apply feedback so you can compare', '先复制目标节点，再应用反馈以便比较'],
  ['Unread', '未读'], ['Apply mode', '应用模式'], ['Reset zoom and pan', '重置缩放和平移'],
  ['Loading diagram...', '正在加载图表…'], ['Show Code', '显示代码'], ['Tasks', '任务'],
  ['Planning next moves', '正在规划下一步'], ['View status', '查看状态'],
  ['Empty canvas. Draw something.', '画布为空，开始绘制吧。'], ['Slides', '幻灯片'],
  ['Line', '直线'], ['Sticky Note', '便签'], ['Design Goodies', '设计素材'],
  ['Pencil not connected', 'Pen 未连接'], ['Click and toggle off and on the Pencil MCP server in settings', '在设置中关闭再开启 Pen MCP 服务器。'],
  // Account, profile, comments, and sharing
  ['Email Address', '邮箱地址'], ['Verification Code', '验证码'], ['Password', '密码'], ['Enter your password', '输入密码'],
  ['Display Name', '显示名称'], ['Your Name', '你的名称'], ['Username', '用户名'],
  ['Unique, URL-friendly username', '唯一且适合 URL 的用户名'], ['Email', '邮箱'], ['Create a password', '创建密码'],
  ['I have a password', '我已有密码'], ['Resend code', '重新发送验证码'], ['Use email code instead', '改用邮箱验证码'],
  ['Skip for now', '暂时跳过'], ['Privacy Policy', '隐私政策'], ['Terms of Use', '使用条款'],
  ['Share a snapshot', '分享快照'], ['Snapshot shared', '快照已分享'],
  ['Your share link was created, but the snapshot may be incomplete.', '分享链接已创建，但快照可能不完整。'],
  ['This share is in another workspace', '此分享位于其他工作区'], ['Checking share status…', '正在检查分享状态…'],
  ['Sign in to comment', '登录后评论'], ['No comments yet', '暂无评论'], ['No open comments', '没有未关闭的评论'],
  ['Nothing resolved yet', '暂无已解决项目'], ['Comments', '评论'], ['Sending…', '正在发送…'],
  ['Retry', '重试'], ['Discard', '放弃'], ['Attachment', '附件'], ['Attach', '附加'],
  ['Attach from workspace', '从工作区附加'], ['Choose images or text files from your cloud workspace.', '从云端工作区选择图片或文本文件。'],
  ['No attachable files in this workspace.', '此工作区没有可附加的文件。'], ['No attachable files', '没有可附加的文件'],
  // AI providers and agent configuration. Provider, model, and API names remain English.
  ['Get Started', '开始使用'], ['Authentication', '认证'], ['Agent Settings', '智能体设置'],
  ['Registering tools…', '正在注册工具…'], ['Re-check connection', '重新检查连接'], ['Details', '详情'],
  ['Its models are available in the model picker.', '其模型会显示在模型选择器中。'],
  ['Connect your AI provider', '连接你的 AI 服务商'], ['Setup Providers', '配置服务商'],
  ['Add custom provider', '添加自定义服务商'], ['Your Claude Code settings (e.g. subscription)', '你的 Claude Code 设置（例如订阅）'],
  ['API key', 'API 密钥'], ['Sign in with Claude (Pro/Max)', '使用 Claude 登录（Pro/Max）'],
  ['Custom model', '自定义模型'], ['Your Codex settings (e.g. subscription)', '你的 Codex 设置（例如订阅）'],
  ['Sign in with ChatGPT Plus/Pro (Codex Subscription)', '使用 ChatGPT Plus/Pro 登录（Codex 订阅）'],
  ['Auto permission mode', '自动授权模式'], ['Let Claude keep designing without asking for permission on each step.', '允许 Claude 持续设计，无需每一步请求授权。'],
  ['Advanced', '高级'], ['Provider', '服务商'], ['My provider', '我的服务商'], ['API type', 'API 类型'],
  ['Base URL', '基础 URL'], ['Authentication & Model', '认证与模型'], ['Model ID', '模型 ID'],
  ['Shows up as a model under this provider in the model picker.', '会在模型选择器中显示为此服务商的模型。'],
  ['Context window', '上下文窗口'], ['Enter a positive number of tokens.', '输入正整数 Token 数量。'],
  ['Install Claude Code and log in', '安装 Claude Code 并登录'], ['Install OpenAI Codex and log in', '安装 OpenAI Codex 并登录'],
  ['Generate Gemini API key', '生成 Gemini API 密钥'], ['Generate a Cursor API key', '生成 Cursor API 密钥'],
  ['Use GitHub Enterprise (optional)', '使用 GitHub Enterprise（可选）'],
  ['Dangerously skip permissions', '跳过权限确认（高风险）'],
  ['Allow agents to run without permission prompts. This gives full file system and command access.', '允许智能体运行时不显示权限提示。这会授予完整文件系统和命令访问权限。'],
  ['Copy MCP config', '复制 MCP 配置'], ['WebMCP tools', 'WebMCP 工具'],
  // Update, status, plans, cookies, and dashboard
  ['Hardware acceleration unavailable', '硬件加速不可用'], ['Please restart the app and try again.', '请重启应用后重试。'],
  ['Failed to start pen.dev', '启动 Pen 失败'], ['Something went wrong while starting pen.dev.', '启动 Pen 时出现问题。'],
  ['Synced', '已同步'], ['Syncing…', '正在同步…'], ['Not synced', '未同步'], ['Sync paused', '同步已暂停'],
  ['Sign In', '登录'], ['Upgrade to keep designing and building', '升级以继续设计和构建'], ['Monthly', '每月'],
  ['Visit your billing settings to review available plans and upgrade.', '前往账单设置查看可用方案并升级。'],
  ['Not now', '暂不'], ['View all plans', '查看所有方案'], ['Upgrade', '升级'],
  ['We use cookies to understand how the web editor is used.', '我们使用 Cookie 来了解网页编辑器的使用情况。'],
  ['Decline', '拒绝'], ['Accept', '接受'], ['Download the app to edit files', '下载应用以编辑文件'],
  ['This is a read-only preview. Download the pen.dev app and this file to make changes.', '这是只读预览。下载 Pen 应用和此文件后即可修改。'],
  ['Free for macOS, Windows and Linux', 'macOS、Windows 和 Linux 免费使用'],
  ['Downloading new version…', '正在下载新版本…'], ['Update Ready', '更新已就绪'],
  ['A new version has been downloaded and is ready to install.', '新版本已下载完成，可以安装。'],
  ['Install on next launch', '下次启动时安装'],
  ['No models found', '未找到模型'], ['Search models…', '搜索模型…'], ['Connecting…', '正在连接…'],
  // Prompt and dashboard helpers
  ['Parallel agents', '并行智能体'], ['Split Work', '拆分工作'], ['Multiple agents work on different tasks', '多个智能体处理不同任务'],
  ['Side by Side', '并肩协作'], ['Multiple agents work on the same task', '多个智能体处理同一任务'],
  ['Reset to main model', '重置为主模型'], ['Iteration mode', '迭代模式'], ['Variants', '变体'],
  ['Choose a style', '选择风格'], ['Design anything…', '设计任何内容…'], ['Recreate a screenshot', '复刻截图'],
  ['Hide forever', '永久隐藏'], ['Create a new file', '创建新文件'],
  ['A style guide adds typography, color, shape, and imagery direction to your prompt.', '风格指南会为提示词添加文字排版、颜色、形状和图像方向。'],
  ['No style', '无风格'], ['Let the prompt decide', '由提示词决定'], ['Last Used', '最近使用'],
  ['Created', '已创建'], ['Grid view', '网格视图'], ['List view', '列表视图'],
  ['Drop .pen file to open', '拖入 .pen 文件以打开'], ['Try Again', '重试'],
  // Native application menu
  ['File', '文件'], ['Edit', '编辑'], ['View', '视图'], ['Window', '窗口'], ['Help', '帮助'],
  ['Prompt Gallery & Tips', '提示词精选与技巧'], ['Prompt Gallery && Tips', '提示词精选与技巧'],
  ['pen.dev Website', 'pen.dev 网站'], ['Cursor Extension', 'Cursor 扩展'], ['VSCode Extension', 'VSCode 扩展'],
  ['Join Our Discord', '加入 Discord'], ['Restart & Install Update', '重启并安装更新'],
  ['Restart && Install Update', '重启并安装更新'], ['Install and Restart', '安装并重启'],
  // Keep MCP, Hook, Token, API and product names in English by omitting them.
]);

// Native Electron menu labels are handled separately from editor literals.
const nativeMenuLabels = new Map([
  ['File', '文件'], ['Edit', '编辑'], ['View', '视图'], ['Window', '窗口'], ['Help', '帮助'],
  ['Small', '小'], ['Medium', '中'], ['Large', '大'],
  ['Settings…', '设置…'], ['New File', '新建文件'], ['Open…', '打开…'], ['Open Recent', '最近打开'],
  ['No Recent Files', '没有最近文件'], ['Clear Recent Files', '清空最近文件'], ['Dashboard', '仪表板'],
  ['Import Image/SVG/Figma...', '导入图片/SVG/Figma…'], ['Export Selection to...', '导出所选内容…'],
  ['Export Snapshot...', '导出快照…'], ['Reset to First Run', '重置首次启动'],
  ['Guide: How to Export Design to Code...', '指南：如何将设计导出为代码…'],
  ['Guide: How to Import from Figma...', '指南：如何从 Figma 导入…'], ["Install 'pen' CLI...", "安装 'pen' CLI…"],
  ['Save', '保存'], ['Save As…', '另存为…'], ['Undo', '撤销'], ['Redo', '重做'],
  ['Show/Hide UI', '显示/隐藏界面'], ['Agent Chat Text Size', '智能体对话文字大小'],
  ['Toggle Developer Tools', '切换开发者工具'], ['Toggle Light/Dark Mode', '切换浅色/深色模式'],
  ['Organize Windows into Grid', '将窗口排列为网格'], ['Prompt Gallery && Tips', '提示词精选与技巧'],
  ['pen.dev Website', 'pen.dev 网站'], ['Cursor Extension', 'Cursor 扩展'], ['VSCode Extension', 'VSCode 扩展'],
  ['Join Our Discord', '加入 Discord'], ['Restart && Install Update', '重启并安装更新'],
  ['Check for Updates…', '检查更新…'], ['No Updates Available', '没有可用更新'],
  ['There are currently no updates available.', '当前没有可用更新。'],
  ['Import from Figma', '从 Figma 导入'], ['How to import from Figma', '如何从 Figma 导入'],
  ['Import Image, SVG or Figma', '导入图片、SVG 或 Figma'], ['Images & Figma', '图片和 Figma'],
  ['All Files', '所有文件'],
]);

function translateLiterals(source) {
  for (const [english, chinese] of labels) source = source.replaceAll(JSON.stringify(english), JSON.stringify(chinese));
  // These labels are embedded in template literals because they include a
  // keyboard shortcut or a dynamic path, so JSON-string replacement cannot see them.
  source = source
    .replaceAll("`${Tt.cmdKey}+${Tt.shiftKey}+S to 'Save As' to a new location`", "`${Tt.cmdKey}+${Tt.shiftKey}+S 另存为到新位置`")
    .replaceAll('`Workspace: ${q}`', '`工作区：${q}`')
    // Keep font-import matching in English. Only the display-only lookup table
    // that feeds the font-weight dropdown is localized.
    .replaceAll(
      'normal:{100:"Thin",200:"Extra Light",300:"Light",400:"Regular",500:"Medium",600:"Semi Bold",700:"Bold",800:"Extra Bold",900:"Black",950:"Heavy"},italic:{100:"Thin Italic",200:"Extra Light Italic",300:"Light Italic",400:"Italic",500:"Medium Italic",600:"Semi Bold Italic",700:"Bold Italic",800:"Extra Bold Italic",900:"Black Italic",950:"Heavy Italic"}',
      'normal:{100:"细",200:"特细",300:"浅",400:"常规",500:"中等",600:"半粗",700:"粗",800:"特粗",900:"黑体",950:"特黑"},italic:{100:"细斜体",200:"特细斜体",300:"浅斜体",400:"斜体",500:"中等斜体",600:"半粗斜体",700:"粗斜体",800:"特粗斜体",900:"黑体斜体",950:"特黑斜体"}'
    )
    .replaceAll('children:"Light"', 'children:"浅色"')
    .replaceAll('children:"Dark"', 'children:"深色"')
    .replaceAll('children:"System"', 'children:"跟随系统"')
    .replaceAll('children:"Medium"', 'children:"中"')
    .replaceAll('children:y.italic?"Italic":"Normal"', 'children:y.italic?"斜体":"常规"')
    .replaceAll('children:x?"Variable"', 'children:x?"变量"');
  return source;
}

function integrity(data) {
  const blockSize = 4 * 1024 * 1024;
  const blocks = [];
  for (let offset = 0; offset < data.length; offset += blockSize) {
    blocks.push(crypto.createHash('sha256').update(data.subarray(offset, Math.min(offset + blockSize, data.length))).digest('hex'));
  }
  return { algorithm: 'SHA256', hash: crypto.createHash('sha256').update(data).digest('hex'), blockSize, blocks };
}

let menuSource = archive.subarray(oldDataStart + Number(menuEntry.offset), oldDataStart + Number(menuEntry.offset) + menuEntry.size).toString('utf8');
menuSource = translateLiterals(menuSource);
for (const [english, chinese] of nativeMenuLabels) menuSource = menuSource.replaceAll(JSON.stringify(english), JSON.stringify(chinese));
menuSource = menuSource
  .replaceAll('`${appDisplayName} Documentation`', '`${appDisplayName} 文档`')
  .replaceAll('`About ${appDisplayName}`', '`关于 ${appDisplayName}`')
  .replaceAll('`Hide ${appDisplayName}`', '`隐藏 ${appDisplayName}`')
  .replaceAll('`Quit ${appDisplayName}`', '`退出 ${appDisplayName}`')
  .replaceAll('{ role: "close" }', '{ role: "close", label: "关闭" }')
  .replaceAll('{ role: "cut" }', '{ role: "cut", label: "剪切" }')
  .replaceAll('{ role: "copy" }', '{ role: "copy", label: "复制" }')
  .replaceAll('{ role: "paste" }', '{ role: "paste", label: "粘贴" }')
  .replaceAll('{ role: "delete" }', '{ role: "delete", label: "删除" }')
  .replaceAll('{ role: "selectAll" }', '{ role: "selectAll", label: "全选" }')
  .replaceAll('{ role: "minimize" }', '{ role: "minimize", label: "最小化" }')
  .replaceAll('{ role: "zoom" }', '{ role: "zoom", label: "缩放" }')
  .replaceAll('{ role: "togglefullscreen" }', '{ role: "togglefullscreen", label: "切换全屏" }');
const patchedMenu = Buffer.from(menuSource, 'utf8');
const patchedEditor = Buffer.from(translateLiterals(originalEditor), 'utf8');

menuEntry.integrity = integrity(patchedMenu);
menuEntry.offset = String(oldData.length + patchedEditor.length);
menuEntry.size = patchedMenu.length;
editorEntry.offset = String(oldData.length);
editorEntry.size = patchedEditor.length;
editorEntry.integrity = integrity(patchedEditor);
const json = Buffer.from(JSON.stringify(header), 'utf8');
const padding = (4 - (json.length % 4)) % 4;
const innerPayloadSize = 4 + json.length + padding;
const dataStart = 16 + json.length + padding;
const prefix = Buffer.alloc(dataStart);
prefix.writeUInt32LE(4, 0);
prefix.writeUInt32LE(innerPayloadSize + 4, 4);
prefix.writeUInt32LE(innerPayloadSize, 8);
prefix.writeUInt32LE(json.length, 12);
json.copy(prefix, 16);
const output = Buffer.concat([prefix, oldData, patchedEditor, patchedMenu]);

const verifyHeader = JSON.parse(output.subarray(16, 16 + output.readUInt32LE(12)).toString('utf8'));
const verifyDataStart = 8 + output.readUInt32LE(4);
const verifyMenuEntry = verifyHeader.files.out.files['menu.js'];
const verifyEditorEntry = verifyHeader.files.out.files.editor.files.assets.files['index.js'];
const verifyMenu = output.subarray(verifyDataStart + Number(verifyMenuEntry.offset), verifyDataStart + Number(verifyMenuEntry.offset) + verifyMenuEntry.size);
const verifyEditor = output.subarray(verifyDataStart + Number(verifyEditorEntry.offset), verifyDataStart + Number(verifyEditorEntry.offset) + verifyEditorEntry.size);
const requiredMenuLabels = ['文件', '编辑', '视图', '窗口', '帮助', '最近打开', '导出所选内容…', '导出快照…', '指南：如何将设计导出为代码…', '另存为…', '设置…'];
if (!verifyEditor.toString('utf8').includes('"对齐"') ||
    !verifyEditor.toString('utf8').includes('100:"细",200:"特细"') ||
    !verifyEditor.toString('utf8').includes('o.includes("Light")') ||
    !requiredMenuLabels.every((label) => verifyMenu.toString('utf8').includes(JSON.stringify(label))) ||
    verifyEditorEntry.integrity.hash !== integrity(verifyEditor).hash ||
    verifyMenuEntry.integrity.hash !== integrity(verifyMenu).hash) {
  throw new Error('Output verification failed; no files were changed.');
}
if (checkOnly) {
  console.log(`Verification passed for Pen ${version}. New archive size: ${output.length} bytes.`);
  process.exit(0);
}

if (!fs.existsSync(backupPath)) fs.copyFileSync(asarPath, backupPath, fs.constants.COPYFILE_EXCL);
const tempPath = `${asarPath}.static-zh-CN.tmp`;
fs.writeFileSync(tempPath, output);
fs.renameSync(tempPath, asarPath);
console.log(`Applied static Simplified Chinese labels to Pen ${version}.`);
console.log(`Original archive backup: ${backupPath}`);
