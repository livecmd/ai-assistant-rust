import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    publicDir: "static",
    server: {
      allowedHosts: ["nodejs.llmapp.org"],
      // 防止 Vite 清除 Rust 显示的错误
      clearScreen: false,
      port: 3000,
      host: "0.0.0.0",
      // port: 1420,
      // Tauri 工作于固定端口，如果端口不可用则报错
      strictPort: true,
      watch: {
        // 告诉 Vite 忽略监听 `src-tauri` 目录
        ignored: ["**/src-tauri/**"],
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_URL": JSON.stringify(env.GEMINI_API_URL),
      "process.env.OPENAI_API_URL": JSON.stringify(env.OPENAI_API_URL),
      "process.env.GEMINI_API_NAME": JSON.stringify(env.GEMINI_API_NAME),
      "process.env.AI_ASSISTANT_GO_BASE_URL": JSON.stringify(env.AI_ASSISTANT_GO_BASE_URL),
    },
    // 添加有关当前构建目标的额外前缀，使这些 CLI 设置的 Tauri 环境变量可以在客户端代码中访问
    envPrefix: ["VITE_", "TAURI_ENV_*"],
    build: {
      // Tauri 在 Windows 上使用 Chromium，在 macOS 和 Linux 上使用 WebKit
      target:
        process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
      // 在 debug 构建中不使用 minify
      minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
      // 在 debug 构建中生成 sourcemap
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
