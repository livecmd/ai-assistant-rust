import { Checkbox, Form, Input, message, Modal, Spin } from "antd";
import "./login.less";
import { useState } from "react";
import apiClient, { createTokenApi } from "@/api";
import AgreementModal from "./AgreementModal";
import privacyMd from "../../隐私政策宇诤.md?raw";
import userAgreementMd from "../../用户协议宇诤.md?raw";

const GEMINI_API_NAME = process.env.GEMINI_API_NAME;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

interface LoginProps {
  setLoginShow: (show: boolean) => void;
}
function Login(props: LoginProps) {
  const [form] = Form.useForm();
  const [loginType, setLoginType] = useState("1"); // 1 user login, 2 register, 3 admin login
  const [btnLoading, setBtnLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreementModal, setAgreementModal] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({ open: false, title: "", content: "" });

  const login = () => {
    if (!agreed) {
      message.warning("请先阅读并同意隐私政策和用户协议");
      return;
    }
    form.submit();
  };

  const showAgreement = (type: "privacy" | "user") => {
    setAgreementModal({
      open: true,
      title: type === "privacy" ? "隐私政策" : "用户协议",
      content: type === "privacy" ? privacyMd : userAgreementMd,
    });
  };

  const onFinish = async (values: any) => {
    if (btnLoading) return;
    setBtnLoading(true);

    try {
      if (loginType === "1") {
        // 普通用户登录逻辑
        const res = await apiClient.login(values);
        if (res.success) {
          const data = res.data;
          if (data && data.id) {
            if (data.group !== "premium" && data.group !== "vip") {
              message.error("当前用户无使用权限，请联系管理员开通！");
              return;
            }
            // Save JWT token for Bearer auth
            if (res.token) {
              localStorage.setItem("token", res.token);
            }
            localStorage.setItem("userInfo", JSON.stringify(data));
            message.success("登录成功");
            await updateStatusData();
            console.log("更新状态信息成功");
            await ensureGeminiKey();
            console.log("获取令牌成功");
            return;
          }
        }
        setBtnLoading(false);
        message.error("登录失败");
      } else if (loginType === "3") {
        const res = await apiClient.adminLogin(values);
        if (res.success) {
          const data = res.data;
          if (data && data.id) {
            if (data.group !== "admin") {
              message.error("当前账号不是管理员账号");
              return;
            }
            if (res.token) {
              localStorage.setItem("token", res.token);
            }
            localStorage.setItem("userInfo", JSON.stringify(data));
            message.success("管理员登录成功");
            props.setLoginShow(false);
            return;
          }
        }
        setBtnLoading(false);
        message.error("管理员登录失败");
      } else {
        // 注册逻辑
        const res = await apiClient.register(values);
        if (res.success) {
          message.success("注册成功");
          setLoginType("1");
          form.resetFields();
          setBtnLoading(false);
          return;
        }
      }
    } catch (error) {
    } finally {
      setBtnLoading(false);
    }
  };

  const updateStatusData = async () => {
    const res = await apiClient.getStatus()
    if (res.success) {
      const data = res.data;
      if (data) {
        console.log("status", data)
        localStorage.setItem("status", JSON.stringify(data))
      }
    }
  };

  const getTokens = async () => {
    try {
      const res = await apiClient.getAllTokens({ p: 1, size: 100 });
      if (!res.success || !res.data) {
        return null;
      }

      const data = res.data;
      console.log("tokens", data);
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const itemKey = data.items.find((item) => item.name === GEMINI_API_NAME) || data.items[0];
      if (!itemKey?.key) {
        return null;
      }

      return `sk-${itemKey.key}`;
    } catch (error) {
      return null;
    } finally {
    }
  };

  const createToken = async () => {
    const res = await createTokenApi({ name: "default", unlimited_quota: true });
    if (res.success) {
      return true;
    }

    return false;
  };

  const ensureGeminiKey = async () => {
    let apiKey = await getTokens();
    if (!apiKey) {
      const created = await createToken();
      if (!created) {
        message.error("key创建失败");
        return;
      }

      for (let attempt = 0; attempt < 3 && !apiKey; attempt += 1) {
        await sleep(400);
        apiKey = await getTokens();
      }
    }

    if (!apiKey) {
      message.error("key获取失败");
      return;
    }

    localStorage.setItem("gemini-key", apiKey);
    props.setLoginShow(false);
  };

  const toReginster = () => {
    form.resetFields();
    setLoginType("2");
  };

  const toLogin = () => {
    form.resetFields();
    setLoginType("1");
  };

  const toAdminLogin = () => {
    form.resetFields();
    setLoginType("3");
  };

  return (
    <Modal
      title={loginType === "1" ? "用户登录" : loginType === "3" ? "管理员登录" : "注册"}
      open={true}
      footer={null}
      centered
      className="login-modal"
      closable={false}
      maskClosable={false}
    >
      <div className="login-container">
        <Form
          form={form}
          layout="vertical"
          className="login-form"
          autoComplete="off"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input className="login-input" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 8, message: "密码长度不能小于8位" },
              { max: 16, message: "密码长度不能大于16位" },
              { pattern: /^[a-zA-Z0-9]+$/, message: "密码只能包含字母和数字" },
            ]}
          >
            <Input.Password className="login-input" autoComplete="off" />
          </Form.Item>
        </Form>
        {loginType === "1" && (
          <div className="control-box">
            <button type="button" className="left switch-button" onClick={toReginster}>
              没有账户？<span>注册</span>
            </button>
            <button type="button" className="right switch-button" onClick={toAdminLogin}>
              管理员？<span>登录</span>
            </button>
          </div>
        )}
        {loginType === "2" && (
          <div className="control-box">
            <button type="button" className="left switch-button" onClick={toLogin}>
              已有账户？<span>登录</span>
            </button>
            <button type="button" className="right switch-button" onClick={toAdminLogin}>
              管理员？<span>登录</span>
            </button>
          </div>
        )}
        {loginType === "3" && (
          <div className="control-box">
            <button type="button" className="left switch-button" onClick={toLogin}>
              普通用户？<span>登录</span>
            </button>
            <button type="button" className="right switch-button" onClick={toReginster}>
              没有账户？<span>注册</span>
            </button>
          </div>
        )}
        <div className="agreement-check">
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="agreement-text">
            我已阅读并同意
            <a onClick={() => showAgreement("privacy")}>《隐私政策》</a>
            和
            <a onClick={() => showAgreement("user")}>《用户协议》</a>
          </span>
        </div>
        <div className={`login-button${!agreed ? " disabled" : ""}`} onClick={login}>
          {loginType === "1" ? "登 录" : loginType === "3" ? "管理员登录" : "注 册"}
          {btnLoading && "···"}
        </div>
      </div>
      <AgreementModal
        open={agreementModal.open}
        title={agreementModal.title}
        content={agreementModal.content}
        onClose={() => setAgreementModal((prev) => ({ ...prev, open: false }))}
      />
    </Modal>
  );
}

export default Login;
