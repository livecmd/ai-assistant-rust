# ai-assistant-go 前端 API 接入文档

本文档面向前端开发者，描述如何与 `ai-assistant-go` 后端服务联调。

## 1. 基础信息

- 后端地址：`http://127.0.0.1:18080`
- 跨域：支持 CORS，Origin 由后端环境变量 `AI_ASSISTANT_WEB_ORIGIN` 控制
- 数据格式：JSON
- 鉴权：JWT Bearer Token

## 2. 认证与授权

### 2.1 Token 流程

```
前端                          后端
 |                              |
|  POST /api/user/login        |
 |  { username, password }      |
 |----------------------------->|
 |                              |
 |  { success, data, token }    |
 |<-----------------------------|
 |                              |
 |  存储 token 到 localStorage   |
 |                              |
 |  GET /api/user/self          |
 |  Authorization: Bearer xxx   |
 |----------------------------->|
 |                              |
 |  { success, data }           |
 |<-----------------------------|
```

### 2.2 前端存储 Token

```typescript
// 登录成功后
localStorage.setItem('token', response.token)

// 发起请求时
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}
const token = localStorage.getItem('token')
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

### 2.3 Token 失效处理

- Token 有效期 **30 天**
- 后端返回 `401` 时，清除 token 并跳转登录页

```typescript
if (response.status === 401) {
  localStorage.removeItem('token')
  window.location.href = '/login'
}
```

## 3. 请求封装建议

### 3.1 基础 fetch 封装

```typescript
const BASE_URL = 'http://127.0.0.1:18080'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '请求失败')
  }
  return json
}
```

### 3.2 用户 API

```typescript
// 类型定义
interface User {
  id: string
  username: string
  group: string
  quota: number
  enabled: boolean
  created_at: string
}

interface TokenItem {
  id: string
  name: string
  key: string
  unlimited_quota: boolean
}

interface TokenList {
  items: TokenItem[]
  p: number
  size: number
  total: number
}

interface Status {
  quota_per_unit: number
  quota_display_type: string
  usd_exchange_rate: number
  custom_currency_symbol: string
  custom_currency_exchange_rate: number
}

interface TopupInfo {
  amount_options: number[]
  discount: Record<string, number>
}

interface PayResult {
  amount: number
  order_no: string
  pay_amount: number
  redirect: string
  status: string
  user_id: string
}

interface PaymentOrder {
  order_no: string
  user_id: string
  amount: number
  pay_amount: number
  bonus_quota: number
  payment_method: string
  status: string
  created_at: string
  paid_at?: string
}

interface PayEnvelope {
  success: boolean
  data: PayResult
  url: string
  error?: string
}

// 用户方法
const userApi = {
  // 普通用户登录
  login(username: string, password: string) {
    return request<{ token: string; data: User }>('/api/user/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  // 注册
  register(username: string, password: string, email?: string) {
    return request<User>('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    })
  },

  // 获取当前用户
  getSelf() {
    return request<User>('/api/user/self')
  },

  // Token 列表
  listTokens(p = 1, size = 100) {
    return request<TokenList>(`/api/token?p=${p}&size=${size}`)
  },

  // 创建 Token
  createToken(name: string, unlimitedQuota = false) {
    return request<TokenItem>('/api/token', {
      method: 'POST',
      body: JSON.stringify({ name, unlimited_quota: unlimitedQuota }),
    })
  },

  // 充值卡兑换
  redeemCard(key: string) {
    return request<User>('/api/user/topup', {
      method: 'POST',
      body: JSON.stringify({ key }),
    })
  },

  // 充值档位信息
  getTopupInfo() {
    return request<TopupInfo>('/api/user/topup/info')
  },

  // 发起支付
  pay(amount: number, paymentMethod = 'alipay') {
    return fetch(BASE_URL + '/api/user/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    }).then((res) => res.json() as Promise<PayEnvelope>)
  },

  // 支付状态查询
  getPayStatus(orderNo: string) {
    return request<PaymentOrder>(`/api/user/pay/status?order_no=${encodeURIComponent(orderNo)}`)
  },
}

// 说明:
// - /api/user/login 只给普通用户使用，admin 账号会被拒绝
// - enabled=false 的用户后端会直接拒绝登录
```

### 3.3 后台管理 API

```typescript
const adminAuthApi = {
  login(username: string, password: string) {
    return request<{ token: string; data: User }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
}

interface ModelConfigItem {
  id: string
  provider: string
  category: string
  model_key: string
  display_name: string
  endpoint: string
  enabled: boolean
  settings_json: string
  remark: string
  created_at: string
  updated_at: string
}

interface ModelPriceItem {
  id: string
  provider: string
  model_key: string
  display_name: string
  billing_type: string
  price: number
  currency: string
  unit: string
  enabled: boolean
  remark: string
  created_at: string
  updated_at: string
}

interface PagedResult<T> {
  items: T[]
  p: number
  size: number
  total: number
}

const adminApi = {
  listUsers(params?: { p?: number; size?: number; keyword?: string; enabled?: boolean }) {
    return request<PagedResult<User>>(`/api/admin/users?${new URLSearchParams(params as Record<string, string>)}`)
  },
  createUser(payload: { username: string; password: string; group: string; quota: number; enabled?: boolean }) {
    return request<User>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateUser(id: string, payload: Partial<{ username: string; password: string; group: string; quota: number; enabled: boolean }>) {
    return request<User>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  setUserEnabled(id: string, enabled: boolean) {
    return request<User>(`/api/admin/users/${id}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) })
  },
  deleteUser(id: string) {
    return request<{ deleted: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' })
  },

  listModelConfigs(params?: { p?: number; size?: number; keyword?: string; provider?: string; category?: string }) {
    return request<PagedResult<ModelConfigItem>>(`/api/admin/model-configs?${new URLSearchParams(params as Record<string, string>)}`)
  },
  createModelConfig(payload: Partial<ModelConfigItem>) {
    return request<ModelConfigItem>('/api/admin/model-configs', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateModelConfig(id: string, payload: Partial<ModelConfigItem>) {
    return request<ModelConfigItem>(`/api/admin/model-configs/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  setModelConfigEnabled(id: string, enabled: boolean) {
    return request<ModelConfigItem>(`/api/admin/model-configs/${id}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) })
  },
  deleteModelConfig(id: string) {
    return request<{ deleted: boolean }>(`/api/admin/model-configs/${id}`, { method: 'DELETE' })
  },

  listModelPrices(params?: { p?: number; size?: number; keyword?: string; provider?: string; model_key?: string }) {
    return request<PagedResult<ModelPriceItem>>(`/api/admin/model-prices?${new URLSearchParams(params as Record<string, string>)}`)
  },
  createModelPrice(payload: Partial<ModelPriceItem>) {
    return request<ModelPriceItem>('/api/admin/model-prices', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateModelPrice(id: string, payload: Partial<ModelPriceItem>) {
    return request<ModelPriceItem>(`/api/admin/model-prices/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  setModelPriceEnabled(id: string, enabled: boolean) {
    return request<ModelPriceItem>(`/api/admin/model-prices/${id}/enabled`, { method: 'PATCH', body: JSON.stringify({ enabled }) })
  },
  deleteModelPrice(id: string) {
    return request<{ deleted: boolean }>(`/api/admin/model-prices/${id}`, { method: 'DELETE' })
  },
}
```

说明:

- 管理员必须先走 `/api/admin/login` 登录，不能复用普通 `/api/user/login`
- 管理接口统一要求 JWT，并且当前登录用户 `group=admin`
- 前端已新增 `/AdminConsole` 页面，可直接调用这些接口
- 管理页必须使用分页接口，不建议一次请求全量数据

### 3.4 公开模型目录 API

```typescript
interface PublicModelConfig {
  id: string
  provider: string
  category: string
  model_key: string
  display_name: string
  endpoint: string
  enabled: boolean
  settings_json: string
  remark: string
  created_at: string
  updated_at: string
}

interface PublicModelPrice {
  id: string
  provider: string
  model_key: string
  display_name: string
  billing_type: string
  price: number
  currency: string
  unit: string
  enabled: boolean
  remark: string
  created_at: string
  updated_at: string
}

const catalogApi = {
  getModelConfigs(params?: { category?: string; provider?: string; keyword?: string }) {
    return request<PublicModelConfig[]>(`/api/catalog/model-configs?${new URLSearchParams(params as Record<string, string>)}`)
  },
  getModelPrices(params?: { provider?: string; model_key?: string; keyword?: string }) {
    return request<PublicModelPrice[]>(`/api/catalog/model-prices?${new URLSearchParams(params as Record<string, string>)}`)
  },
}
```

说明:

- 这两个接口无需登录，供前台页面动态读取模型启停和价格展示
- 只返回后台已启用的记录
- 当前前台图片页、视频页、3D 工作台已经接入该目录接口

### 3.5 AI 文本 API

```typescript
interface MessagePart {
  text: string
}

interface Message {
  role: 'user' | 'model' | 'assistant'
  parts: MessagePart[]
}

interface ChatRequest {
  model: string
  prompt: string
  history: Message[]
}

interface ChatResponse {
  text: string
}

const aiTextApi = {
  chat(model: string, prompt: string, history: Message[] = []) {
    return request<ChatResponse>('/api/ai/text/chat', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, history }),
    })
  },
}
```

### 3.4 AI 图片 API

```typescript
interface ImageInput {
  base64: string      // data:image/png;base64,... 或纯 base64
  mimeType: string    // image/png, image/jpeg
}

interface ImageConfig {
  aspectRatio?: string  // "1:1", "4:3", "16:9"
  imageSize?: string    // "1K"
}

interface SingleImageResult {
  imageDataUrl: string  // 前端优先使用此字段
  assetUrl: string
  taskId: string
}

interface MultiImageResult {
  images: string[]
  assetUrls: string[]
  taskIds: string[]
}

const aiImageApi = {
  // GenAI Image Studio（文生图 / 图生图）
  genAIStudio(prompt: string, model: string, images: ImageInput[] = [], config?: ImageConfig) {
    return request<SingleImageResult>('/api/ai/image/genai-studio', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, images, config: config || { aspectRatio: '1:1' } }),
    })
  },

  // CMF 设计
  cmfDesign(params: {
    modelId: string
    targetProduct: ImageInput
    referencePattern: ImageInput
    adherenceLevel: number
    config?: ImageConfig
    feedback?: string
  }) {
    return request<SingleImageResult>('/api/ai/image/cmf', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Camera Director
  cameraDirector(params: {
    modelId: string
    params: { rotationH: number; rotationV: number; zoom: number; distortion: boolean }
    promptOverride?: string
    config?: ImageConfig
    inputImage?: string  // data:image/png;base64,...
  }) {
    return request<SingleImageResult>('/api/ai/image/camera-director', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // 线稿上色
  lineArtColorizer(params: {
    lineArt: string       // data:image/png;base64,...
    styleRef?: string     // data:image/png;base64,...
    config: {
      model: string
      aspectRatio: string
      resolution?: string
      prompt?: string
      thinkingMode?: string
      apiKey?: string
    }
  }) {
    return request<SingleImageResult>('/api/ai/image/line-art-colorizer', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // StyleMorph
  styleMorph(params: {
    imageA: string
    imageB: string
    config: {
      weight: number
      structuralDepth: number
      model: string
      imageSize?: string
      aspectRatio?: string
      batchSize?: number
      refinementPrompt?: string
    }
    widthA: number
    heightA: number
    maskA?: unknown
    lassoPathA?: unknown[]
  }) {
    return request<MultiImageResult>('/api/ai/image/stylemorph', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Cinematic Multi Shot
  cinematicMultiShot(params: {
    sourceImages: string[]
    style: string
    prompt: string
    shot: { id: string; name: string; description: string; aspectRatio: string }
    quality?: string
    styleImage?: string
  }) {
    return request<SingleImageResult>('/api/ai/image/cinematic-multi-shot', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Medical Styler 风格分析
  medicalAnalyze(params: {
    modelId: string
    referenceImageBase64: string
  }) {
    return request<{ text: string }>('/api/ai/image/medical-styler/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Medical Styler 生成
  medicalGenerate(params: {
    modelId: string
    structureImageBase64: string
    productName: string
    stylePrompt: string
    strength: number
    mode: string
    config: {
      aspectRatio: string
      guidanceScale?: number
      negativePrompt?: string
      // 其他字段后端接收但未使用
    }
  }) {
    return request<SingleImageResult>('/api/ai/image/medical-styler/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
}
```

### 3.5 AI 视频 API

```typescript
interface VideoResult {
  downloadUrl: string
  taskId: string
  video: {
    task_id: string
    status: string
    model: string
    url: string
  }
}

const aiVideoApi = {
  generate(params: {
    prompt: string
    model: string         // "veo_3_1"
    aspectRatio: string   // "16:9"
    resolution?: string   // "720p"
    referenceImage?: ImageInput
  }) {
    return request<VideoResult>('/api/ai/video/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
}
```

## 4. 接口权限速查

| 接口 | 需要 Token | 备注 |
|------|:---------:|------|
| `GET /health` | 否 | 健康检查 |
| `POST /api/user/register` | 否 | 注册 |
| `POST /api/user/login` | 否 | 登录（返回 token） |
| `GET /api/user/self` | 是 | 当前用户 |
| `GET /api/status` | 否 | 系统状态 |
| `GET /api/token` | 是 | Token 列表 |
| `POST /api/token` | 是 | 创建 Token |
| `POST /api/user/topup` | 是 | 充值卡兑换 |
| `GET /api/user/topup/info` | 否 | 充值档位 |
| `POST /api/user/pay` | 是 | 发起支付 |
| `GET /api/user/pay/status` | 是 | 支付状态 |
| `GET /api/user/pay/checkout` | 否 | 支付回调跳转 |
| `GET /console/log` | 否 | 支付完成页面（HTML） |
| `POST /api/ai/text/chat` | 否 | 文本聊天 |
| `POST /api/ai/image/*` | 否 | 图片生成 |
| `POST /api/ai/video/generate` | 否 | 视频生成 |

## 5. 支付流程前端实现

```typescript
// 1. 用户选择金额并点击支付
const payResult = await userApi.pay(20, 'alipay')

// 2. payResult 是 PayEnvelope 结构，不是标准 apiResponse
//    结构: { success, data: { amount, order_no, pay_amount, ... }, url }

// 3. 跳转到支付回调 URL
window.location.href = `${payResult.url}?order_no=${payResult.data.order_no}&redirect=${payResult.data.redirect}`

// 4. 支付完成后回到应用，可通过 order_no 查询状态
const order = await userApi.getPayStatus(payResult.data.order_no)
```

## 6. 图片数据 URL 处理

后端返回的 `imageDataUrl` 格式为 `data:image/jpeg;base64,...`，前端可直接用于 `<img>` 标签：

```tsx
// React 示例
<img src={result.imageDataUrl} alt="Generated" />
```

如果后端只返回纯 base64（无 `data:` 前缀），需要手动拼接：

```typescript
function ensureDataURL(base64: string, mimeType = 'image/jpeg'): string {
  if (base64.startsWith('data:')) return base64
  return `data:${mimeType};base64,${base64}`
}
```

## 7. 常见错误处理

```typescript
try {
  const result = await aiImageApi.genAIStudio('A cat', 'gemini-2.5-flash-image')
} catch (err) {
  if (err.message === 'Unauthorized') {
    // 跳转登录
  } else {
    // 显示 err.message 给用户
  }
}
```

| 错误场景 | 处理方式 |
|----------|----------|
| 401 未授权 | 清除 token，跳转登录页 |
| 400 参数错误 | 显示 `error` 字段信息 |
| 502 上游失败 | AI 服务不可用，提示用户重试 |
| Token 过期 | 同 401 处理 |
