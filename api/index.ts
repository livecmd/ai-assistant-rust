import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

// API 响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  status?: number;
  error?: string;
  url?: string;
  token?: string;
}

// API Client 配置类型
interface ApiClientConfig {
  baseUrl?: string;
  credentials?: RequestCredentials;
}

export interface PublicModelConfig {
  id: string;
  provider: string;
  category: string;
  model_key: string;
  display_name: string;
  endpoint: string;
  enabled: boolean;
  settings_json: string;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface PublicModelPrice {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  billing_type: string;
  price: number;
  currency: string;
  unit: string;
  enabled: boolean;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfigItem {
  id: string;
  provider: string;
  method_key: string;
  display_name: string;
  app_id: string;
  private_key: string;
  alipay_public_key: string;
  seller_id: string;
  store_id: string;
  terminal_id: string;
  notify_path: string;
  return_path: string;
  subject_prefix: string;
  timeout_express: string;
  sandbox: boolean;
  enabled: boolean;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface TripoTaskCreateData {
  taskId: string;
}

export interface TripoTaskDetailData {
  taskId: string;
  type: string;
  status: string;
  progress: number;
  consumedCredit?: number;
  modelUrl?: string;
  baseModelUrl?: string;
  pbrModelUrl?: string;
  localModelPath?: string;
  localBaseModelPath?: string;
  localPbrModelPath?: string;
  generatedImageUrl?: string;
  renderedImageUrl?: string;
  localGeneratedImagePath?: string;
  localRenderedImagePath?: string;
  riggable?: boolean;
  rigType?: string;
  multiview?: {
    frontViewUrl?: string;
    leftViewUrl?: string;
    backViewUrl?: string;
    rightViewUrl?: string;
  };
  localMultiview?: {
    frontViewPath?: string;
    leftViewPath?: string;
    backViewPath?: string;
    rightViewPath?: string;
  };
}

export interface TripoConfigCheckData {
  baseUrl?: string;
  apiKeyConfigured: boolean;
  apiKeyPreview?: string;
  reachable: boolean;
  authenticated: boolean;
  statusCode?: number;
  message?: string;
}

const runtimeFetch: typeof fetch =
  typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)
    ? window.fetch.bind(window)
    : (tauriFetch as typeof fetch);

/**
 * 标准化 API Client 类
 */
class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private credentials: RequestCredentials;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.AI_ASSISTANT_GO_BASE_URL || "https://api.yuzhengdesign.com";
    this.credentials = config.credentials || "include";
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  /**
   * 设置自定义请求头
   * @param headers - 要设置的请求头对象
   * @param merge - 是否合并现有请求头，默认为 true
   */
  setHeaders(headers: Record<string, string>, merge: boolean = true): void {
    if (merge) {
      this.headers = { ...this.headers, ...headers };
    } else {
      this.headers = headers;
    }
  }

  /**
   * 获取当前请求头
   */
  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  /**
   * 移除指定的请求头
   * @param key - 要移除的请求头 key
   */
  removeHeader(key: string): void {
    delete this.headers[key];
  }

  /**
   * 设置 baseUrl
   * @param url - API 基础地址
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 统一的请求处理方法
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        this.headers["Authorization"] = `Bearer ${token}`;
      } else {
        delete this.headers["Authorization"];
      }
      const url = `${this.baseUrl}${endpoint}`;
      const response = await runtimeFetch(url, {
        credentials: this.credentials,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        ...options,
      });

      let data: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      }

      console.debug(data)

      // 检查响应状态
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userInfo");
          localStorage.removeItem("gemini-key");
        }

        return {
          success: false,
          status: response.status,
          error: data?.error || data?.message || `HTTP error! status: ${response.status}`,
          data: null,
        };
      }

      if (data?.success == false) {
        return {
          success: false,
          status: response.status,
          error: data.error || data.message || "请求失败",
          data: null,
        };
      }

      return {
        success: true,
        data: data?.data ?? null,
        status: response.status,
        error: data?.error || data?.message || "请求失败",
        url: data?.url,
        token: data?.token,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "请求失败",
        data: null,
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params).toString();
      url = `${endpoint}?${searchParams}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * POST 请求
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ============ 业务 API 方法 ============

  /**
   * 用户登录
   */
  async login(data: { username: string; password: string }) {
    return this.post("/api/user/login", data);
  }

  /**
   * 管理员登录
   */
  async adminLogin(data: { username: string; password: string }) {
    return this.post("/api/admin/login", data);
  }

  /**
   * 用户注册
   */
  async register(data: { username: string; password: string; email?: string }) {
    return this.post("/api/user/register", data);
  }

  /**
   * 获取所有令牌
   */
  async getAllTokens(params: { p: number; size: number }) {
    return this.get("/api/token", params);
  }

  /**
   * 创建令牌
   */
  async createToken(data: { name: string; unlimited_quota?: boolean }) {
    return this.post("/api/token", data);
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    return this.get("/api/user/self");
  }

  /**
   * 修改用户密码
   */
  async changePassword(data: { old_password: string; new_password: string }) {
    return this.post("/api/user/password", data);
  }

  /**
   * 兑换卡密
   */
  async redeemCard(data: { key: string }) {
    return this.post("/api/user/topup", data);
  }

  /**
   * 获取状态
   */
  async getStatus() {
    return this.get("/api/status");
  }

  /**
   * 充值
   */
  async pay(data: { amount: number, payment_method: string }) {
    return this.post("/api/user/pay", data);
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(params: { order_no: string }) {
    return this.get("/api/user/pay/status", params);
  }

  /**
   * 获取充值配置信息
   */
  async getTopupInfo() {
    return this.get("/api/user/topup/info")
  }

  async listPaymentConfigs(params: { p?: number; size?: number; keyword?: string; provider?: string; method_key?: string; enabled?: boolean | string }) {
	return this.get("/api/admin/payment-configs", params);
  }

  async createPaymentConfig(data: any) {
	return this.post("/api/admin/payment-configs", data);
  }

  async updatePaymentConfig(id: string, data: any) {
	return this.put(`/api/admin/payment-configs/${id}`, data);
  }

  async setPaymentConfigEnabled(id: string, enabled: boolean) {
	return this.patch(`/api/admin/payment-configs/${id}/enabled`, { enabled });
  }

  async deletePaymentConfig(id: string) {
	return this.delete(`/api/admin/payment-configs/${id}`);
  }

  async listAdminUsers(params: { p?: number; size?: number; keyword?: string; enabled?: boolean | string }) {
    return this.get("/api/admin/users", params);
  }

  async createAdminUser(data: any) {
    return this.post("/api/admin/users", data);
  }

  async updateAdminUser(id: string, data: any) {
    return this.put(`/api/admin/users/${id}`, data);
  }

  async setAdminUserEnabled(id: string, enabled: boolean) {
    return this.patch(`/api/admin/users/${id}/enabled`, { enabled });
  }

  async deleteAdminUser(id: string) {
    return this.delete(`/api/admin/users/${id}`);
  }

  async listModelConfigs(params: { p?: number; size?: number; keyword?: string; provider?: string; category?: string; enabled?: boolean | string }) {
    return this.get("/api/admin/model-configs", params);
  }

  async createModelConfig(data: any) {
    return this.post("/api/admin/model-configs", data);
  }

  async updateModelConfig(id: string, data: any) {
    return this.put(`/api/admin/model-configs/${id}`, data);
  }

  async setModelConfigEnabled(id: string, enabled: boolean) {
    return this.patch(`/api/admin/model-configs/${id}/enabled`, { enabled });
  }

  async deleteModelConfig(id: string) {
    return this.delete(`/api/admin/model-configs/${id}`);
  }

  async listModelPrices(params: { p?: number; size?: number; keyword?: string; provider?: string; model_key?: string; enabled?: boolean | string }) {
    return this.get("/api/admin/model-prices", params);
  }

  async createModelPrice(data: any) {
    return this.post("/api/admin/model-prices", data);
  }

  async updateModelPrice(id: string, data: any) {
    return this.put(`/api/admin/model-prices/${id}`, data);
  }

  async setModelPriceEnabled(id: string, enabled: boolean) {
    return this.patch(`/api/admin/model-prices/${id}/enabled`, { enabled });
  }

  async deleteModelPrice(id: string) {
    return this.delete(`/api/admin/model-prices/${id}`);
  }

  async getPublicModelConfigs(params: { keyword?: string; provider?: string; category?: string }) {
	return this.get<PublicModelConfig[]>("/api/catalog/model-configs", params);
  }

  async getPublicModelPrices(params: { keyword?: string; provider?: string; model_key?: string }) {
	return this.get<PublicModelPrice[]>("/api/catalog/model-prices", params);
  }

  async tripoTextToModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/text-to-model", data);
  }

  async tripoImageToModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/image-to-model", data);
  }

  async tripoGenerateMultiview(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/generate-multiview", data);
  }

  async tripoMultiviewToModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/multiview-to-model", data);
  }

  async tripoRefineModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/refine-model", data);
  }

  async tripoTextureModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/texture-model", data);
  }

  async tripoMeshSegmentation(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/mesh-segmentation", data);
  }

  async tripoMeshCompletion(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/mesh-completion", data);
  }

  async tripoHighpolyToLowpoly(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/highpoly-to-lowpoly", data);
  }

  async tripoPreRigCheck(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/prerig-check", data);
  }

  async tripoRig(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/rig", data);
  }

  async tripoRetarget(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/retarget", data);
  }

  async tripoStylizeModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/stylize-model", data);
  }

  async tripoConvertModel(data: any) {
    return this.post<TripoTaskCreateData>("/api/ai/3d/convert-model", data);
  }

  async getTripoTask(taskId: string) {
    return this.get<TripoTaskDetailData>(`/api/ai/3d/task/${taskId}`);
  }

  async getTripoConfigCheck() {
	return this.get<TripoConfigCheckData>("/api/ai/3d/config-check");
  }
}

// 创建默认实例
const apiClient = new ApiClient();

// 导出类和默认实例
export { ApiClient, apiClient };
export default apiClient;

// 为了向后兼容，保留原有的函数式 API
export const loginApi = async (data: any) => apiClient.login(data);
export const adminLoginApi = async (data: any) => apiClient.adminLogin(data);
export const registerApi = async (data: any) => apiClient.register(data);
export const getAllTokensApi = async (data: any) =>
  apiClient.getAllTokens(data);
export const getUserInfoApi = async () => apiClient.getUserInfo();
export const changePasswordApi = async (data: {
  old_password: string;
  new_password: string;
}) => apiClient.changePassword(data);
export const redeemCardApi = async (data: any) => apiClient.redeemCard(data);
export const createTokenApi = async (data: any) => apiClient.createToken(data);
export const getStatus = async () => apiClient.getStatus();
export const pay = async (data: any) => apiClient.pay(data);
export const getPaymentStatus = async (data: any) => apiClient.getPaymentStatus(data);
export const getTopupInfo = async () => apiClient.getTopupInfo();
export const listPaymentConfigsApi = async (params: any) => apiClient.listPaymentConfigs(params);
export const createPaymentConfigApi = async (data: any) => apiClient.createPaymentConfig(data);
export const updatePaymentConfigApi = async (id: string, data: any) => apiClient.updatePaymentConfig(id, data);
export const setPaymentConfigEnabledApi = async (id: string, enabled: boolean) => apiClient.setPaymentConfigEnabled(id, enabled);
export const deletePaymentConfigApi = async (id: string) => apiClient.deletePaymentConfig(id);
export const listAdminUsersApi = async (params: any) => apiClient.listAdminUsers(params);
export const createAdminUserApi = async (data: any) => apiClient.createAdminUser(data);
export const updateAdminUserApi = async (id: string, data: any) => apiClient.updateAdminUser(id, data);
export const setAdminUserEnabledApi = async (id: string, enabled: boolean) => apiClient.setAdminUserEnabled(id, enabled);
export const deleteAdminUserApi = async (id: string) => apiClient.deleteAdminUser(id);
export const listModelConfigsApi = async (params: any) => apiClient.listModelConfigs(params);
export const createModelConfigApi = async (data: any) => apiClient.createModelConfig(data);
export const updateModelConfigApi = async (id: string, data: any) => apiClient.updateModelConfig(id, data);
export const setModelConfigEnabledApi = async (id: string, enabled: boolean) => apiClient.setModelConfigEnabled(id, enabled);
export const deleteModelConfigApi = async (id: string) => apiClient.deleteModelConfig(id);
export const listModelPricesApi = async (params: any) => apiClient.listModelPrices(params);
export const createModelPriceApi = async (data: any) => apiClient.createModelPrice(data);
export const updateModelPriceApi = async (id: string, data: any) => apiClient.updateModelPrice(id, data);
export const setModelPriceEnabledApi = async (id: string, enabled: boolean) => apiClient.setModelPriceEnabled(id, enabled);
export const deleteModelPriceApi = async (id: string) => apiClient.deleteModelPrice(id);
export const getPublicModelConfigsApi = async (params: any) => apiClient.getPublicModelConfigs(params);
export const getPublicModelPricesApi = async (params: any) => apiClient.getPublicModelPrices(params);
export const tripoTextToModelApi = async (data: any) => apiClient.tripoTextToModel(data);
export const tripoImageToModelApi = async (data: any) => apiClient.tripoImageToModel(data);
export const tripoGenerateMultiviewApi = async (data: any) => apiClient.tripoGenerateMultiview(data);
export const tripoMultiviewToModelApi = async (data: any) => apiClient.tripoMultiviewToModel(data);
export const tripoRefineModelApi = async (data: any) => apiClient.tripoRefineModel(data);
export const tripoTextureModelApi = async (data: any) => apiClient.tripoTextureModel(data);
export const tripoMeshSegmentationApi = async (data: any) => apiClient.tripoMeshSegmentation(data);
export const tripoMeshCompletionApi = async (data: any) => apiClient.tripoMeshCompletion(data);
export const tripoHighpolyToLowpolyApi = async (data: any) => apiClient.tripoHighpolyToLowpoly(data);
export const tripoPreRigCheckApi = async (data: any) => apiClient.tripoPreRigCheck(data);
export const tripoRigApi = async (data: any) => apiClient.tripoRig(data);
export const tripoRetargetApi = async (data: any) => apiClient.tripoRetarget(data);
export const tripoStylizeModelApi = async (data: any) => apiClient.tripoStylizeModel(data);
export const tripoConvertModelApi = async (data: any) => apiClient.tripoConvertModel(data);
export const getTripoTaskApi = async (taskId: string) => apiClient.getTripoTask(taskId);
export const getTripoConfigCheckApi = async () => apiClient.getTripoConfigCheck();

// 使用示例：
/*
// 方式1: 使用默认实例
import apiClient from './api';

apiClient.setHeaders({ 'Authorization': 'Bearer token123' });
apiClient.login({ username: 'test', password: '123456' })
  .then(result => {
    if (result.success) {
      console.log('登录成功:', result.data);
    } else {
      console.error('登录失败:', result.error);
    }
  });

// 方式2: 创建自定义实例
import { ApiClient } from './api';

const customClient = new ApiClient({ baseUrl: 'https://custom-api.com' });
customClient.setHeaders({ 'X-Custom-Header': 'value' });
customClient.get('/api/data');

// 方式3: 使用兼容的函数式 API
import { loginApi } from './api';
loginApi({ username: 'test', password: '123456' });
*/
