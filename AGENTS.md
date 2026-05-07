# AGENTS.md

本文件给后续 AI coding agent 使用，帮助快速理解并安全修改这个仓库。

## 项目概览

这是 **万象魔方**，一个面向图像、视频和 3D 生成的 AI 创作工作台。

- 前端：React 19 + TypeScript + Vite
- 桌面壳：Tauri 2，Rust 代码在 `src-tauri/`
- UI：Ant Design v6、Less、少量 Tailwind CDN class、lucide-react / Ant Design icons
- 后端：AI 与用户体系由独立 Go 服务提供，前端通过 `AI_ASSISTANT_GO_BASE_URL` 访问
- 主语言：中文 UI 为主，英文翻译通过 `i18n/` 补充

前端不要直接调用 Gemini/OpenAI 等模型 API。页面级 AI 能力应通过 Go 后端的 `/api/ai/*` 接口代理。

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
npm run tauri-dev
npm run tauri-build
```

说明：

- `npm run dev` 启动 Vite，端口固定为 `3000`，host 为 `0.0.0.0`。
- `npm run build` 输出到 `dist/`。
- `tauri-dev` / `tauri-build` 会先运行 Vite 对应命令，再进入 Tauri 流程。
- 当前没有配置测试脚本、lint 脚本或格式化脚本。修改后至少运行 `npm run build` 做基础验证。

## 环境变量

参考 `.env.example`，本地一般复制为 `.env.local`。

```bash
AI_ASSISTANT_GO_BASE_URL=https://api.yuzhengdesign.com
GEMINI_API_URL=https://api.yuzhengdesign.com
OPENAI_API_URL=https://api.yuzhengdesign.com
GEMINI_API_NAME=default
```

这些变量在 `vite.config.ts` 中通过 `define` 注入为 `process.env.*`。其中最重要的是 `AI_ASSISTANT_GO_BASE_URL`，默认回落到 `https://api.yuzhengdesign.com`。

## 重要目录

```text
.
├── App.tsx                    # 应用主入口、顶部栏、侧边菜单、页面切换、登录状态检测
├── App.less                   # 全局和主布局样式
├── api/
│   ├── index.ts               # ApiClient，用户、管理后台、支付、3D 等通用 REST API
│   └── assistant.ts           # assistantPost<T>()，页面级 AI POST 请求
├── components/
│   ├── shared/                # 通用预览、历史、控制面板、生成按钮、模型/比例选择器
│   └── UserLogin/             # 登录、注册、用户中心
├── hooks/
│   ├── useTranslation.ts      # i18n hook
│   └── useModelCatalog.ts     # 公开模型配置和价格目录
├── i18n/                      # zh-CN / en-US 翻译表和语言持久化
├── pages/                     # 各 AI 功能页面
├── static/                    # Vite publicDir，图标和静态资源
├── src-tauri/                 # Tauri/Rust 桌面端能力、配置、图标
├── utils/
│   ├── indexedDB.ts           # 各页面生成历史的 IndexedDB 存储
│   └── helper.ts              # 状态、积分、通用工具
├── dist/                      # 构建产物，通常不要手改
├── ai-ass-dist/               # 分发/构建产物，通常不要手改
└── node_modules/              # 依赖目录，不要手改
```

## 应用入口与页面切换

`App.tsx` 是主入口。它负责：

- 顶部品牌区、主题切换、用户中心入口
- 左侧功能菜单
- 登录弹窗和用户信息弹窗
- 定时刷新用户登录状态，间隔约 6 秒
- 根据 `pathnameState` 控制不同页面的显示

注意：当前页面主体不是完全依赖 `<Routes>` 渲染。实际工作区里，各页面组件常驻挂载，通过 `display: pathnameState === "/xxx" ? "block" : "none"` 切换显示；下方有一段旧版 `Routes` 代码被注释。新增页面时要同步菜单项、路径状态和实际渲染块。

当前页面：

| 路径 | 目录 | 功能 |
| --- | --- | --- |
| `/GenAIImageStudio` | `pages/genAI-Image-Studio/` | 万能图片生成 |
| `/GeminiProductAI` | `pages/gemini-medecal-styler/` | 材质迁移 / 产品渲染 |
| `/Cmftransfer` | `pages/cmf-ai/` | CMF 设计 |
| `/AICameraDirector` | `pages/ai-Camera-director/` | 多视角生成 |
| `/AILineArtColorizer` | `pages/ai-line-art-colorizer/` | 线稿上色 |
| `/StyleMorph` | `pages/stylemorph/` | 造型迁移 |
| `/CinematicMultiShot` | `pages/cinematic-multi-shot/` | 一键场景生成 |
| `/VeoStudio` | `pages/veo-studio/` | 视频生成 |
| `/TripoStudio` | `pages/tripo-3d-studio/` | 3D 工作台 |
| `/AdminConsole` | `pages/admin-console/` | 后台管理，仅 admin 用户显示 |

## API 约定

### 通用 API

`api/index.ts` 导出 `apiClient` 单例和一组兼容旧代码的函数式 API。

它负责：

- 默认 base URL：`process.env.AI_ASSISTANT_GO_BASE_URL || "https://api.yuzhengdesign.com"`
- 请求前从 `localStorage("token")` 读取 JWT，并设置 `Authorization: Bearer ...`
- 浏览器环境使用 `window.fetch`
- Tauri 环境使用 `@tauri-apps/plugin-http`
- 401 时清理 `token`、`userInfo`、`gemini-key`
- 用户、管理后台、支付、公开模型配置、公开价格、Tripo 3D 任务等接口

新增通用后端能力时，优先挂到 `ApiClient`，并在文件底部补一个函数式导出，保持既有调用风格。

### 页面级 AI API

`api/assistant.ts` 提供：

```ts
assistantPost<T>(path: string, payload: unknown): Promise<T>
```

各页面的 `services/` 通常调用它，例如：

- `pages/genAI-Image-Studio/services/geminiService.ts` -> `/api/ai/image/genai-studio`
- `pages/cmf-ai/services/geminiService.ts` -> `/api/ai/image/cmf`
- `pages/ai-Camera-director/services/geminiService.ts` -> `/api/ai/image/camera-director`
- `pages/ai-line-art-colorizer/services/geminiService.ts` -> `/api/ai/image/line-art-colorizer`
- `pages/stylemorph/services/geminiService.ts` -> `/api/ai/image/stylemorph`
- `pages/cinematic-multi-shot/services/geminiService.ts` -> `/api/ai/image/cinematic-multi-shot`
- `pages/gemini-medecal-styler/services/gemini.ts` -> `/api/ai/image/medical-styler/analyze` 和 `/api/ai/image/medical-styler/generate`
- `pages/veo-studio/services/geminiService.ts` -> `/api/ai/video/generate`
- `pages/gemini-chat/services/gemini.ts` -> `/api/ai/text/chat`

不要在页面里散落裸 `fetch`。如果是页面 AI 请求，用 `assistantPost`；如果是系统/用户/管理/3D API，用 `apiClient`。

## 页面开发约定

页面通常采用这个结构：

```text
pages/<feature>/
├── index.tsx
├── index.less
├── types.ts
├── services/
│   └── geminiService.ts 或 gemini.ts
└── components/
```

优先复用 `components/shared/`：

- `UnifiedPreview`：图片/视频预览
- `UnifiedHistory`：生成历史
- `UnifiedControlPanel`：参数面板
- `UnifiedGenerateButton`：生成按钮
- `CommonModelSelector`：模型选择
- `CommonAspectRatioSelector`：比例选择
- `LoadingIndicator`：加载状态

`说明文档.md` 明确要求：各页面尽量共享预览、历史、参数设置、生成按钮。`VeoStudio` 是视频场景，预览和历史需要保留视频播放/下载兼容。

生成历史优先使用 `utils/indexedDB.ts`，每个页面对应一个 `STORES` key。新增页面如果需要历史，先补充 store，再接入 `saveHistory` / `loadHistory` / `deleteHistoryItem` / `clearHistory`。

## 样式约定

- 全局样式在 `App.less`，页面样式放在对应页面的 `index.less`。
- 共享组件样式在 `components/shared/shared.less` 和组件旁的 `.less`。
- Ant Design 主题在 `App.tsx` 的 `ConfigProvider` 中设置，主色为 `#5b7cff`。
- 字体栈偏中文：MiSans、PingFang SC、Hiragino Sans GB、Microsoft YaHei、Noto Sans SC。
- Tailwind 是通过 `index.html` CDN 使用，不是 PostCSS/Tailwind 构建链。
- 新 UI 要贴合工作台产品：清晰、紧凑、可扫描，避免营销页式大面积 hero。

## 认证与权限

- 登录弹窗：`components/UserLogin/Login.tsx`
- 用户中心：`components/UserLogin/UserInfoModal.tsx`
- token 存储：`localStorage("token")`
- 用户信息存储：`localStorage("userInfo")`
- 管理入口只对 `currentUser.group === "admin"` 显示
- 支持用户组：`premium`、`vip`、`admin`
- `App.tsx` 中存在一个 TOTP 密码门逻辑，修改认证流时要检查其交互影响

## Tauri 注意事项

Tauri 配置在 `src-tauri/tauri.conf.json`：

- `devUrl`: `http://localhost:3000`
- `frontendDist`: `../dist`
- `beforeDevCommand`: `npm run dev`
- `beforeBuildCommand`: `npm run build`
- 应用标题：`万象魔方`
- bundle 开启 updater artifacts

Rust 端在 `src-tauri/src/lib.rs`，当前提供：

- `download_binary`
- `cache_remote_asset`
- `download_remote_asset`
- `open_payment_window`

这些能力主要服务视频/3D/支付等桌面场景。改动 Rust 命令时，同步检查前端 `invoke` 调用、`src-tauri/capabilities/*.json` 权限和 Tauri 构建。

## i18n 约定

- 翻译表：`i18n/translations.ts`
- 语言类型：`zh-CN`、`en-US`
- 语言持久化 key：`localStorage("app-language")`
- hook：`hooks/useTranslation.ts`

新增用户可见文案时，优先补翻译 key。中文是主语言，不要把核心中文 UI 替换成纯英文。

## 修改原则

- 先读对应页面和共享组件的现有写法，再改代码。
- 保持 `@/` 路径别名，它指向项目根目录。
- 不要手动修改 `dist/`、`ai-ass-dist/`、`node_modules/`。
- 不要把本地 `.env.local` 内容写入文档或提交。
- AI 生成请求应继续走后端代理，不要在前端新增模型密钥直连逻辑。
- 处理 3D 资产时，注意浏览器 URL、Tauri 本地缓存路径、远程代理 URL 三种形态。
- 图片/视频下载逻辑要同时考虑浏览器和 Tauri 环境。
- 若新增 Gemini 2.5 类图片批量生成，注意后端/模型限流，必要时使用顺序生成而不是一次性并发。
- 改登录、支付、扣费、模型价格和 admin 功能时要格外小心，这些属于高风险业务路径。

## 验证建议

文档或样式小改：

```bash
npm run build
```

涉及 Tauri / Rust：

```bash
npm run tauri-build
```

涉及页面交互：

1. 启动 `npm run dev`
2. 打开 `http://localhost:3000`
3. 至少手动检查被修改页面、登录态提示、生成按钮禁用/加载状态、历史记录展示

涉及 API：

- 检查请求是否带上 `Authorization`
- 检查 401 后是否能清理登录态并回到登录流程
- 检查错误消息是否对用户可理解
- 检查 Tauri 环境是否仍走 `@tauri-apps/plugin-http`

