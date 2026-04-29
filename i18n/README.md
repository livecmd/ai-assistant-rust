# 国际化 (i18n) 使用指南

## 概述

项目已集成完整的中英双语支持系统，包括：

- 自动语言检测（基于浏览器设置）
- 语言偏好持久化（使用 localStorage）
- React Hook 方便集成
- 全局语言切换按钮

## 文件结构

```
i18n/
├── index.ts          # i18n 核心系统
└── translations.ts   # 中英文翻译资源

components/
└── LanguageSwitcher.tsx  # 语言切换按钮组件

hooks/
└── useTranslation.ts     # React Hook
```

## 使用方法

### 1. 在组件中使用翻译

```tsx
import { useTranslation } from "../../hooks/useTranslation";

const MyComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("genai.title")}</h1>
      <button>{t("common.generate")}</button>
    </div>
  );
};
```

### 2. 添加新的翻译键

在 `i18n/translations.ts` 中添加：

```typescript
export const translations = {
  "zh-CN": {
    "your.key": "你的中文翻译",
  },
  "en-US": {
    "your.key": "Your English translation",
  },
};
```

### 3. 添加语言切换按钮

语言切换按钮已集成到主应用侧边栏中。

要在其他位置添加：

```tsx
import { LanguageSwitcher } from "./components/LanguageSwitcher";

<LanguageSwitcher />;
```

## 已有的翻译键

### 常用键

- `common.upload` - 上传
- `common.download` - 下载
- `common.generate` - 生成
- `common.save` - 保存
- `common.cancel` - 取消
- `common.close` - 关闭
- `common.prompt` - 提示词
- `common.history` - 历史记录

### 页面专用键

每个页面都有自己的翻译命名空间：

- `genai.*` - 全能图片设计助手
- `material.*` - 材质迁移
- `cmf.*` - CMF 设计助手
- `camera.*` - 可控多角度生成
- `lineart.*` - 线稿生成

完整列表请查看 `i18n/translations.ts`

## 语言切换

用户可以通过侧边栏底部的语言切换按钮在中英文之间切换。选择的语言会：

1. 立即应用到所有页面
2. 保存到 localStorage
3. 下次访问时自动恢复

## 页面集成示例

查看以下文件了解如何在页面中集成 i18n：

- `App.tsx` - 主应用集成示例
- `pages/genAI-Image-Studio/index.tsx` - 页面集成示例（待更新）

## 下一步

要为现有页面添加 i18n 支持：

1. 导入 `useTranslation` hook
2. 使用 `t()` 函数替换硬编码的文本
3. 确保所有文本都有对应的翻译键
