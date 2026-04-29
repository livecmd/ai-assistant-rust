import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  createAdminUserApi,
  createModelConfigApi,
  createModelPriceApi,
  createPaymentConfigApi,
  deleteAdminUserApi,
  deleteModelConfigApi,
  deleteModelPriceApi,
  deletePaymentConfigApi,
  listAdminUsersApi,
  listModelConfigsApi,
  listModelPricesApi,
  listPaymentConfigsApi,
  setAdminUserEnabledApi,
  setModelConfigEnabledApi,
  setModelPriceEnabledApi,
  setPaymentConfigEnabledApi,
  updateAdminUserApi,
  updateModelConfigApi,
  updateModelPriceApi,
  updatePaymentConfigApi,
} from "@/api";

type AdminUser = {
  id: string;
  username: string;
  group: string;
  quota: number;
  enabled: boolean;
  created_at: string;
};

type ModelConfigItem = {
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
};

type ModelPriceItem = {
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
};

type PaymentConfigItem = {
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
};

type Paged<T> = {
  items: T[];
  p: number;
  size: number;
  total: number;
};

const AdminConsole = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = currentUser?.group === "admin";

  const [userForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [priceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const [users, setUsers] = useState<Paged<AdminUser>>({ items: [], p: 1, size: 10, total: 0 });
  const [configs, setConfigs] = useState<Paged<ModelConfigItem>>({ items: [], p: 1, size: 10, total: 0 });
  const [prices, setPrices] = useState<Paged<ModelPriceItem>>({ items: [], p: 1, size: 10, total: 0 });
  const [payments, setPayments] = useState<Paged<PaymentConfigItem>>({ items: [], p: 1, size: 10, total: 0 });

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [userKeyword, setUserKeyword] = useState("");
  const [configKeyword, setConfigKeyword] = useState("");
  const [priceKeyword, setPriceKeyword] = useState("");
  const [paymentKeyword, setPaymentKeyword] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingConfig, setEditingConfig] = useState<ModelConfigItem | null>(null);
  const [editingPrice, setEditingPrice] = useState<ModelPriceItem | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentConfigItem | null>(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadUsers = async (page = users.p, size = users.size, keyword = userKeyword) => {
    setLoadingUsers(true);
    const res = await listAdminUsersApi({ p: page, size, keyword });
    setLoadingUsers(false);
    if (!res.success) {
      message.error(res.error || "加载用户失败");
      return;
    }
    setUsers(res.data as Paged<AdminUser>);
  };

  const loadConfigs = async (page = configs.p, size = configs.size, keyword = configKeyword) => {
    setLoadingConfigs(true);
    const res = await listModelConfigsApi({ p: page, size, keyword });
    setLoadingConfigs(false);
    if (!res.success) {
      message.error(res.error || "加载模型配置失败");
      return;
    }
    setConfigs(res.data as Paged<ModelConfigItem>);
  };

  const loadPrices = async (page = prices.p, size = prices.size, keyword = priceKeyword) => {
    setLoadingPrices(true);
    const res = await listModelPricesApi({ p: page, size, keyword });
    setLoadingPrices(false);
    if (!res.success) {
      message.error(res.error || "加载模型价格失败");
      return;
    }
    setPrices(res.data as Paged<ModelPriceItem>);
  };

  const loadPayments = async (page = payments.p, size = payments.size, keyword = paymentKeyword) => {
    setLoadingPayments(true);
    const res = await listPaymentConfigsApi({ p: page, size, keyword });
    setLoadingPayments(false);
    if (!res.success) {
      message.error(res.error || "加载支付配置失败");
      return;
    }
    setPayments(res.data as Paged<PaymentConfigItem>);
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadUsers(1, 10, "");
    loadConfigs(1, 10, "");
    loadPrices(1, 10, "");
    loadPayments(1, 10, "");
  }, [isAdmin]);

  const openCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({ group: "premium", enabled: true, quota: 0 });
    setUserModalOpen(true);
  };

  const openEditUser = (record: AdminUser) => {
    setEditingUser(record);
    userForm.setFieldsValue({ ...record, password: "" });
    setUserModalOpen(true);
  };

  const saveUser = async () => {
    const values = await userForm.validateFields();
    const payload = { ...values };
    const res = editingUser
      ? await updateAdminUserApi(editingUser.id, payload)
      : await createAdminUserApi(payload);
    if (!res.success) {
      message.error(res.error || "保存用户失败");
      return;
    }
    message.success(editingUser ? "用户已更新" : "用户已创建");
    setUserModalOpen(false);
    loadUsers();
  };

  const openCreateConfig = () => {
    setEditingConfig(null);
    configForm.resetFields();
    configForm.setFieldsValue({ enabled: true });
    setConfigModalOpen(true);
  };

  const openEditConfig = (record: ModelConfigItem) => {
    setEditingConfig(record);
    configForm.setFieldsValue(record);
    setConfigModalOpen(true);
  };

  const saveConfig = async () => {
    const values = await configForm.validateFields();
    const res = editingConfig
      ? await updateModelConfigApi(editingConfig.id, values)
      : await createModelConfigApi(values);
    if (!res.success) {
      message.error(res.error || "保存模型配置失败");
      return;
    }
    message.success(editingConfig ? "模型配置已更新" : "模型配置已创建");
    setConfigModalOpen(false);
    loadConfigs();
  };

  const openCreatePrice = () => {
    setEditingPrice(null);
    priceForm.resetFields();
    priceForm.setFieldsValue({ enabled: true, currency: "CNY", unit: "per_call", price: 0 });
    setPriceModalOpen(true);
  };

  const openEditPrice = (record: ModelPriceItem) => {
    setEditingPrice(record);
    priceForm.setFieldsValue(record);
    setPriceModalOpen(true);
  };

  const savePrice = async () => {
    const values = await priceForm.validateFields();
    const res = editingPrice
      ? await updateModelPriceApi(editingPrice.id, values)
      : await createModelPriceApi(values);
    if (!res.success) {
      message.error(res.error || "保存模型价格失败");
      return;
    }
    message.success(editingPrice ? "模型价格已更新" : "模型价格已创建");
    setPriceModalOpen(false);
    loadPrices();
  };

  const openCreatePayment = () => {
  setEditingPayment(null);
  paymentForm.resetFields();
  paymentForm.setFieldsValue({
    provider: "alipay",
    method_key: "alipay_f2f",
    display_name: "支付宝当面付",
    notify_path: "/api/user/pay/alipay/notify",
    return_path: "/console/log",
    subject_prefix: "AI Assistant 充值",
    timeout_express: "15m",
    sandbox: true,
    enabled: false,
  });
  setPaymentModalOpen(true);
  };

  const openEditPayment = (record: PaymentConfigItem) => {
  setEditingPayment(record);
  paymentForm.setFieldsValue(record);
  setPaymentModalOpen(true);
  };

  const savePayment = async () => {
  const values = await paymentForm.validateFields();
  const res = editingPayment
    ? await updatePaymentConfigApi(editingPayment.id, values)
    : await createPaymentConfigApi(values);
  if (!res.success) {
    message.error(res.error || "保存支付配置失败");
    return;
  }
  message.success(editingPayment ? "支付配置已更新" : "支付配置已创建");
  setPaymentModalOpen(false);
  loadPayments();
  };

  const userColumns: ColumnsType<AdminUser> = [
    { title: "用户名", dataIndex: "username", key: "username" },
    { title: "分组", dataIndex: "group", key: "group", render: (value) => <Tag color={value === "admin" ? "gold" : "blue"}>{value}</Tag> },
    { title: "额度", dataIndex: "quota", key: "quota" },
    { title: "状态", dataIndex: "enabled", key: "enabled", render: (_, record) => <Switch checked={record.enabled} onChange={(checked) => setAdminUserEnabledApi(record.id, checked).then(() => loadUsers())} /> },
    { title: "创建时间", dataIndex: "created_at", key: "created_at" },
    {
      title: "操作",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditUser(record)}>编辑</Button>
          <Popconfirm title="确认删除该用户？" onConfirm={async () => {
            const res = await deleteAdminUserApi(record.id);
            if (!res.success) {
              message.error(res.error || "删除用户失败");
              return;
            }
            message.success("用户已删除");
            loadUsers();
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const configColumns: ColumnsType<ModelConfigItem> = [
    { title: "提供方", dataIndex: "provider", key: "provider" },
    { title: "类型", dataIndex: "category", key: "category" },
    { title: "模型 Key", dataIndex: "model_key", key: "model_key" },
    { title: "展示名", dataIndex: "display_name", key: "display_name" },
    { title: "状态", dataIndex: "enabled", key: "enabled", render: (_, record) => <Switch checked={record.enabled} onChange={(checked) => setModelConfigEnabledApi(record.id, checked).then(() => loadConfigs())} /> },
    {
      title: "操作",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditConfig(record)}>编辑</Button>
          <Popconfirm title="确认删除该模型配置？" onConfirm={async () => {
            const res = await deleteModelConfigApi(record.id);
            if (!res.success) {
              message.error(res.error || "删除模型配置失败");
              return;
            }
            message.success("模型配置已删除");
            loadConfigs();
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const priceColumns: ColumnsType<ModelPriceItem> = [
    { title: "提供方", dataIndex: "provider", key: "provider" },
    { title: "模型 Key", dataIndex: "model_key", key: "model_key" },
    { title: "计费类型", dataIndex: "billing_type", key: "billing_type" },
    { title: "价格", dataIndex: "price", key: "price" },
    { title: "币种", dataIndex: "currency", key: "currency" },
    { title: "单位", dataIndex: "unit", key: "unit" },
    { title: "状态", dataIndex: "enabled", key: "enabled", render: (_, record) => <Switch checked={record.enabled} onChange={(checked) => setModelPriceEnabledApi(record.id, checked).then(() => loadPrices())} /> },
    {
      title: "操作",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditPrice(record)}>编辑</Button>
          <Popconfirm title="确认删除该模型价格？" onConfirm={async () => {
            const res = await deleteModelPriceApi(record.id);
            if (!res.success) {
              message.error(res.error || "删除模型价格失败");
              return;
            }
            message.success("模型价格已删除");
            loadPrices();
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const paymentColumns: ColumnsType<PaymentConfigItem> = [
  { title: "提供方", dataIndex: "provider", key: "provider" },
  { title: "方式标识", dataIndex: "method_key", key: "method_key" },
  { title: "展示名", dataIndex: "display_name", key: "display_name" },
  { title: "AppID", dataIndex: "app_id", key: "app_id", render: (value) => value || "-" },
  { title: "环境", dataIndex: "sandbox", key: "sandbox", render: (value) => <Tag color={value ? "orange" : "green"}>{value ? "沙箱" : "生产"}</Tag> },
  { title: "状态", dataIndex: "enabled", key: "enabled", render: (_, record) => <Switch checked={record.enabled} onChange={(checked) => setPaymentConfigEnabledApi(record.id, checked).then(() => loadPayments())} /> },
  {
    title: "操作",
    key: "actions",
    render: (_, record) => (
    <Space>
      <Button size="small" onClick={() => openEditPayment(record)}>编辑</Button>
      <Popconfirm title="确认删除该支付配置？" onConfirm={async () => {
      const res = await deletePaymentConfigApi(record.id);
      if (!res.success) {
        message.error(res.error || "删除支付配置失败");
        return;
      }
      message.success("支付配置已删除");
      loadPayments();
      }}>
      <Button size="small" danger>删除</Button>
      </Popconfirm>
    </Space>
    ),
  },
  ];

  if (!isAdmin) {
    return (
      <Card style={{ margin: 24 }}>
        <Alert type="warning" showIcon message="仅管理员可访问后台管理页" description="请使用管理员账号登录后再进入此页面。默认已将 demo 用户提升为 admin。" />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>后台管理</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>统一管理用户、模型配置和模型价格</div>
          </div>
        </div>
      </Card>

      <Tabs
        items={[
          {
            key: "users",
            label: "用户管理",
            children: (
              <Card>
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search placeholder="搜索用户名或分组" allowClear onSearch={(value) => { setUserKeyword(value); loadUsers(1, users.size, value); }} style={{ width: 280 }} />
                  <Button type="primary" onClick={openCreateUser}>新增用户</Button>
                </Space>
                <Table rowKey="id" loading={loadingUsers} columns={userColumns} dataSource={users.items} pagination={{ current: users.p, pageSize: users.size, total: users.total, onChange: (page, pageSize) => loadUsers(page, pageSize, userKeyword) }} />
              </Card>
            ),
          },
          {
            key: "configs",
            label: "模型配置管理",
            children: (
              <Card>
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search placeholder="搜索 provider / model key" allowClear onSearch={(value) => { setConfigKeyword(value); loadConfigs(1, configs.size, value); }} style={{ width: 280 }} />
                  <Button type="primary" onClick={openCreateConfig}>新增模型配置</Button>
                </Space>
                <Table rowKey="id" loading={loadingConfigs} columns={configColumns} dataSource={configs.items} pagination={{ current: configs.p, pageSize: configs.size, total: configs.total, onChange: (page, pageSize) => loadConfigs(page, pageSize, configKeyword) }} />
              </Card>
            ),
          },
          {
            key: "prices",
            label: "模型价格管理",
            children: (
              <Card>
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search placeholder="搜索 provider / model key" allowClear onSearch={(value) => { setPriceKeyword(value); loadPrices(1, prices.size, value); }} style={{ width: 280 }} />
                  <Button type="primary" onClick={openCreatePrice}>新增模型价格</Button>
                </Space>
                <Table rowKey="id" loading={loadingPrices} columns={priceColumns} dataSource={prices.items} pagination={{ current: prices.p, pageSize: prices.size, total: prices.total, onChange: (page, pageSize) => loadPrices(page, pageSize, priceKeyword) }} />
              </Card>
            ),
          },
          {
      key: "payments",
      label: "支付配置管理",
      children: (
        <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search placeholder="搜索 provider / method key / app id" allowClear onSearch={(value) => { setPaymentKeyword(value); loadPayments(1, payments.size, value); }} style={{ width: 320 }} />
          <Button type="primary" onClick={openCreatePayment}>新增支付配置</Button>
        </Space>
        <Table rowKey="id" loading={loadingPayments} columns={paymentColumns} dataSource={payments.items} pagination={{ current: payments.p, pageSize: payments.size, total: payments.total, onChange: (page, pageSize) => loadPayments(page, pageSize, paymentKeyword) }} />
        </Card>
      ),
      },
        ]}
      />

      <Modal title={editingUser ? "编辑用户" : "新增用户"} open={userModalOpen} onOk={saveUser} onCancel={() => setUserModalOpen(false)} destroyOnClose>
        <Form form={userForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={editingUser ? [] : [{ required: true, message: "请输入密码" }, { min: 8, message: "至少 8 位" }]}>
            <Input.Password placeholder={editingUser ? "不填则保持原密码" : "至少 8 位"} />
          </Form.Item>
          <Form.Item name="group" label="分组" rules={[{ required: true, message: "请输入分组" }]}>
            <Input placeholder="premium / admin" />
          </Form.Item>
          <Form.Item name="quota" label="额度" rules={[{ required: true, message: "请输入额度" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingConfig ? "编辑模型配置" : "新增模型配置"} open={configModalOpen} onOk={saveConfig} onCancel={() => setConfigModalOpen(false)} width={720} destroyOnClose>
        <Form form={configForm} layout="vertical">
          <Form.Item name="provider" label="提供方" rules={[{ required: true, message: "请输入提供方" }]}><Input /></Form.Item>
          <Form.Item name="category" label="模型类型" rules={[{ required: true, message: "请输入模型类型" }]}><Input placeholder="text / image / video / 3d" /></Form.Item>
          <Form.Item name="model_key" label="模型 Key" rules={[{ required: true, message: "请输入模型 Key" }]}><Input /></Form.Item>
          <Form.Item name="display_name" label="展示名称" rules={[{ required: true, message: "请输入展示名称" }]}><Input /></Form.Item>
          <Form.Item name="endpoint" label="接口端点"><Input /></Form.Item>
          <Form.Item name="settings_json" label="配置 JSON"><Input.TextArea rows={6} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingPrice ? "编辑模型价格" : "新增模型价格"} open={priceModalOpen} onOk={savePrice} onCancel={() => setPriceModalOpen(false)} destroyOnClose>
        <Form form={priceForm} layout="vertical">
          <Form.Item name="provider" label="提供方" rules={[{ required: true, message: "请输入提供方" }]}><Input /></Form.Item>
          <Form.Item name="model_key" label="模型 Key" rules={[{ required: true, message: "请输入模型 Key" }]}><Input /></Form.Item>
          <Form.Item name="display_name" label="展示名称"><Input /></Form.Item>
          <Form.Item name="billing_type" label="计费类型" rules={[{ required: true, message: "请输入计费类型" }]}><Input placeholder="input / output / per_call / per_second" /></Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true, message: "请输入价格" }]}><InputNumber style={{ width: "100%" }} min={0} step={0.01} /></Form.Item>
          <Form.Item name="currency" label="币种" rules={[{ required: true, message: "请输入币种" }]}><Input /></Form.Item>
          <Form.Item name="unit" label="计价单位" rules={[{ required: true, message: "请输入单位" }]}><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

    <Modal title={editingPayment ? "编辑支付配置" : "新增支付配置"} open={paymentModalOpen} onOk={savePayment} onCancel={() => setPaymentModalOpen(false)} width={820} destroyOnClose>
    <Form form={paymentForm} layout="vertical">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="支付宝验签配置说明"
        description="如果报 alipay precreate: crypto/rsa: verification error，优先检查 4 项：1. 沙箱开关是否和 AppID 所属环境一致；2. alipay_public_key 必须是支付宝平台公钥，不是应用公钥；3. private_key 必须和当前 AppID 配套；4. 生产环境不要混用沙箱公钥。"
      />
      <Form.Item name="provider" label="提供方" rules={[{ required: true, message: "请输入提供方" }]}><Input /></Form.Item>
      <Form.Item name="method_key" label="方式标识" rules={[{ required: true, message: "请输入方式标识" }]}><Input /></Form.Item>
      <Form.Item name="display_name" label="展示名称" rules={[{ required: true, message: "请输入展示名称" }]}><Input /></Form.Item>
      <Form.Item name="app_id" label="支付宝 AppID"><Input /></Form.Item>
      <Form.Item name="private_key" label="应用私钥"><Input.TextArea rows={5} /></Form.Item>
      <Form.Item name="alipay_public_key" label="支付宝公钥"><Input.TextArea rows={5} /></Form.Item>
      <Form.Item name="seller_id" label="卖家支付宝用户 ID"><Input /></Form.Item>
      <Form.Item name="store_id" label="门店 ID"><Input /></Form.Item>
      <Form.Item name="terminal_id" label="终端 ID"><Input /></Form.Item>
      <Form.Item name="notify_path" label="异步通知地址"><Input placeholder="/api/user/pay/alipay/notify" /></Form.Item>
      <Form.Item name="return_path" label="支付成功跳转地址"><Input placeholder="/console/log" /></Form.Item>
      <Form.Item name="subject_prefix" label="订单标题前缀"><Input /></Form.Item>
      <Form.Item name="timeout_express" label="超时时间"><Input placeholder="15m / 1h" /></Form.Item>
      <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
      <Form.Item name="sandbox" label="沙箱环境" valuePropName="checked"><Switch /></Form.Item>
      <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
    </Form>
    </Modal>
    </div>
  );
};

export default AdminConsole;
