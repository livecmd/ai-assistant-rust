# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**万象魔方 (WanXiang MoFang)** — an AI-powered image/video/3D generation studio. React 19 + Vite frontend that calls a Go backend (`ai-assistant-go`, separate repo). Also builds as a Tauri desktop app.

Product name: 万象魔方. Chinese is the primary UI language.

## Commands

```bash
npm run dev          # Vite dev server on http://0.0.0.0:3000
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run tauri-dev    # Tauri desktop dev mode
npm run tauri-build  # Tauri desktop production build
```

No test runner or linter is configured.

## Environment

Copy `.env.example` to `.env.local`. Key variables injected via `vite.config.ts` `define`:
- `AI_ASSISTANT_GO_BASE_URL` — Go backend base URL (default: `https://api.yuzhengdesign.com`)
- `GEMINI_API_URL`, `OPENAI_API_URL`, `GEMINI_API_KEY`, `GEMINI_API_NAME`

## Architecture

### Routing & Pages

Single SPA in `App.tsx` using `react-router-dom`. Default route redirects to `/GenAIImageStudio`. Each route maps to a page under `pages/`:

| Route | Page dir | Feature |
|-------|----------|---------|
| `/GenAIImageStudio` | `genAI-Image-Studio` | 万能图片生成 (text/image-to-image) |
| `/GeminiProductAI` | `gemini-medecal-styler` | 材质迁移 |
| `/Cmftransfer` | `cmf-ai` | CMF 设计 |
| `/AICameraDirector` | `ai-Camera-director` | 多视角生成 |
| `/AILineArtColorizer` | `ai-line-art-colorizer` | 线稿上色 |
| `/StyleMorph` | `stylemorph` | 造型迁移 |
| `/CinematicMultiShot` | `cinematic-multi-shot` | 一键场景生成 |
| `/VeoStudio` | `veo-studio` | 视频生成 |
| `/TripoStudio` | `tripo-3d-studio` | 3D 工作台 |
| `/AdminConsole` | `admin-console` | 后台管理 (admin only) |

### Shared Components (`components/shared/`)

Pages share a unified set of UI components (documented in `说明文档.md`):
- `UnifiedPreview` — preview area for generated images/videos
- `UnifiedHistory` — generation history gallery
- `UnifiedControlPanel` — parameter settings panel
- `UnifiedGenerateButton` — generation trigger button
- `CommonModelSelector` / `CommonAspectRatioSelector` — model and ratio pickers
- `LoadingIndicator` — progress display

Each page typically has its own `index.tsx`, `index.less`, `types.ts`, and a `services/` dir.

### API Layer (`api/`)

- `api/index.ts` — `ApiClient` class (singleton `apiClient`). All REST calls go through this. Handles JWT Bearer auth from `localStorage("token")`, 401 auto-logout. Dual export: class methods + backward-compatible function exports (`loginApi`, `getUserInfoApi`, etc.).
- `api/assistant.ts` — lightweight `assistantPost<T>()` helper for page-level AI calls to the Go backend.

The frontend does **not** call AI model APIs directly — all AI requests are proxied through the Go backend at `/api/ai/*`. See `FRONTEND_API_DOC.md` for full endpoint reference.

### Tauri Integration

`src-tauri/` contains the Rust/Tauri shell (gitignored from this repo). HTTP requests use `@tauri-apps/plugin-http` when running in Tauri, standard `fetch` in browser — handled by `runtimeFetch` detection in `api/index.ts`.

### Auth & User System

- Login via `LoginModal` component; token stored in `localStorage("token")`
- User groups: `premium`, `vip`, `admin` — checked on an interval (every 6s)
- TOTP password gate exists in `App.tsx` (OTPAuth library)
- Admin console visible only to `group === "admin"` users

### Styling

- **Less** for component styles (`App.less`, `shared.less`, per-page `.less` files)
- **Tailwind CSS** via CDN in `index.html` (not PostCSS-integrated)
- **Ant Design v6** (`antd`) with `ConfigProvider` theme (light/dark toggle)
- Primary color: `#5b7cff`
- Font stack: MiSans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC

### i18n

`i18n/` with `useTranslation` hook. Supports `zh-CN` and `en-US`. Language stored in `localStorage("app-language")`.

### Path Alias

`@/` maps to project root (configured in both `vite.config.ts` and `tsconfig.json`).

## Key Conventions

- Page structure follows the pattern: index.tsx + index.less + types.ts + services/
- Gemini 2.5 image endpoints should use sequential generation (not `Promise.allSettled` batch) due to rate-limit issues
- Video resources (VeoStudio) need video-specific handling in preview and history components
- `indexedDB.ts` in `utils/` is used for local storage of generated assets
