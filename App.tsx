import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import Cmftransfer from "./pages/cmf-ai/index";
import GeminiProductAI from "./pages/gemini-medecal-styler/index";
import VeoStudio from "./pages/veo-studio/index";
import GenAIImageStudio from "./pages/genAI-Image-Studio/index.tsx";
import AICameraDirector from "./pages/ai-Camera-director/index";
import GeminiChat from "./pages/gemini-chat/index";
import AILineArtColorizer from "./pages/ai-line-art-colorizer/index";
import StyleMorph from "./pages/stylemorph/index";
import CinematicMultiShot from "./pages/cinematic-multi-shot/index";
import TripoStudio from "./pages/tripo-3d-studio/index";
import AdminConsole from "./pages/admin-console/index";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "./hooks/useTranslation";
import * as OTPAuth from "otpauth";
import "./App.less";
import LoginModal from "./components/UserLogin/Login.tsx";

import {
  CodepenCircleOutlined,
  TwitchOutlined,
  PieChartOutlined,
  FileJpgOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  ControlOutlined,
  AreaChartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Modal, Input, message } from "antd";
const { TextArea } = Input;
const { Content, Sider, Header } = Layout;
import UserInfoModal from "./components/UserLogin/UserInfoModal";
import { getUserInfoApi } from "@/api";


function getItem(label, key, icon?, children?) {
  return {
    key,
    icon,
    children,
    label,
  };
}

// 获取路由地址
let pathname = window.location.pathname;
if (pathname === "/") {
  pathname = "/GenAIImageStudio";
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get("q");
  const [pathnameState, setPathnameState] = useState(location.pathname);
  const [loginShow, setLoginShow] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "null");
    } catch {
      return null;
    }
  })();

  // 密码验证状态
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // TOTP 密钥
  const MY_SECRET: string = "JBSWY3DPEHPK3PXP";

  useEffect(() => {
    setPathnameState(location.pathname);

    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      setLoginShow(true);
    }
  }, [location]);

  useEffect(() => {
    // 定时检测登录状态
    const checkLoginStatus = async () => {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          const res = await getUserInfoApi();
          // 如果登录状态异常或未登录，则清空相关数据，并提示登录
          if (!res.success) {
            // Token expired or invalid
            if (res.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("userInfo");
              localStorage.removeItem("gemini-key");
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              setLoginShow(true);
              message.error("登录状态已过期，请重新登录");
            } else {
              console.log("登录状态异常", res);
            }
          } else if (res.data && !["premium", "admin"].includes(res.data.group)) {
            // 检测分组是否为premium
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            localStorage.removeItem("gemini-key");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setLoginShow(true);
            message.error("当前用户无使用权限，请联系管理员开通！");
          }
        } catch (error: any) {
          if (error?.message?.includes("401")) {
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            localStorage.removeItem("gemini-key");
            setLoginShow(true);
          }
          console.error("Failed to check login status:", error);
        }
      }
    };

    const intervalId = setInterval(checkLoginStatus, 6000); // 每6秒检测一次

    return () => clearInterval(intervalId);
  }, []);

  const setUser = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      setShowInfo(true);
    } else {
      setLoginShow(true);
    }
  };

  const handlePasswordSubmit = () => {
    const totp = new OTPAuth.TOTP({
      issuer: "AI_Assistant",
      label: "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: MY_SECRET,
    });
    const isValid = totp.validate({ token: passwordInput, window: 1 }) !== null;
    if (isValid) {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("密码错误，请重试");
      setPasswordInput("");
    }
  };

  const items = [
    // getItem(t('nav.genai'), "/GenAIImageStudio", <FileJpgOutlined />),
    // getItem(t('nav.material'), "/GeminiProductAI", <ControlOutlined />),
    // getItem(t('nav.cmf'), "/Cmftransfer", <PieChartOutlined />),
    // getItem(t('nav.camera'), "/AICameraDirector", <VideoCameraOutlined />),
    // getItem(t('nav.lineart'), "/AILineArtColorizer", <AreaChartOutlined />),
    // getItem(t('nav.veo'), "/VeoStudio", <TwitchOutlined />),
    {
      img: "/7.svg",
      title: "万能图片生成",
      dec: "Image design assistant",
      path: "/GenAIImageStudio",
    },
    {
      img: "/8.svg",
      title: "材质迁移",
      dec: "Material Transfer",
      path: "/GeminiProductAI",
    },
    {
      img: "/9.svg",
      title: "CMF设计",
      dec: "CMF design",
      path: "/Cmftransfer",
    },
    {
      img: "/10.svg",
      title: "多视角生成",
      dec: "multi-view generation",
      path: "/AICameraDirector",
    },
    {
      img: "/11.svg",
      title: "线稿上色",
      dec: "Sketch Rendering",
      path: "/AILineArtColorizer",
    },
    {
      img: "/1.svg",
      title: "造型迁移",
      dec: "Model migration",
      path: "/StyleMorph",
    },
    {
      img: "/2.svg",
      title: "一键场景生成",
      dec: "One-click scene generation",
      path: "/CinematicMultiShot",
    },
    {
      img: "/12.svg",
      title: "视频生成",
      dec: "video generation",
      path: "/VeoStudio",
    },
    {
      img: "/3.svg",
      title: "3D工作台",
      dec: "3D Studio",
      path: "/TripoStudio",
    },
    ...(currentUser?.group === "admin"
      ? [
        {
          img: "/12.svg",
          title: "后台管理",
          dec: "Admin Console",
          path: "/AdminConsole",
        },
      ]
      : []),
  ];

  const clickItem = ({ key }) => {
    navigate(key);
  };

  const handleOk = () => {
    if (!newKey)
      return message.error(t("common.error") + ": " + t("common.error"));
    localStorage.setItem("gemini-key", newKey);
    setIsModalOpen(false);
    window.location.reload();
  };

  return (
    <Layout className="app-container" style={{ minHeight: "100vh" }}>
      <div className="mainTop">
        <div className="logo">
          <img src="/logo3x.png" alt="logo" />
        </div>
        <div className="info" onClick={setUser}>
          <UserOutlined
            style={{ color: "#fff", marginRight: "10px", fontSize: 18 }}
          />
          <span>用户中心</span>
        </div>
      </div>
      <div className="main">
        <div className="menu">
          {items.map((item, index) => {
            return (
              <div
                onClick={() => {
                  setPathnameState(item.path);
                  navigate(item.path);
                }}
                className={`menu-item ${item.path == pathnameState ? "active" : ""
                  }`}
                key={index}
              >
                <img src={item.img} alt="" />
                <div className="text">
                  <p style={{ fontSize: 19 }}>{item.title}</p>
                  <p style={{ fontSize: 13 }}>{item.dec}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/GenAIImageStudio" replace />}
            />
            <Route
              path="/"
              element={<Navigate to="/GenAIImageStudio" replace />}
            />

            <Route path="/GenAIImageStudio" element={<GenAIImageStudio />} />
            <Route path="/GeminiProductAI" element={<GeminiProductAI />} />
            <Route path="/Cmftransfer" element={<Cmftransfer />} />
            <Route path="/AICameraDirector" element={<AICameraDirector />} />
            <Route
              path="/AILineArtColorizer"
              element={<AILineArtColorizer />}
            />
            <Route path="/VeoStudio" element={<VeoStudio />} />
            <Route path="/StyleMorph" element={<StyleMorph />} />
            <Route
              path="/CinematicMultiShot"
              element={<CinematicMultiShot />}
            />
            <Route path="/TripoStudio" element={<TripoStudio />} />
            <Route path="/AdminConsole" element={<AdminConsole />} />
          </Routes>
        </div>
      </div>
      {loginShow && <LoginModal setLoginShow={setLoginShow} />}
      {showInfo && <UserInfoModal onCancel={() => setShowInfo(false)} />}

      {/* <Sider
        className="sider-left"
      >
       
        <Menu
          theme="dark"
          defaultSelectedKeys={[pathname]}
          mode="inline"
          items={items}
          onClick={clickItem}
        />
        <div style={{ padding: '12px' }}>
          <Button
            className="copy-official-btn"
            block
            onClick={async () => {
              const url = 'https://ai.google.dev/gemini-api';
              try {
                await navigator.clipboard.writeText(url);
                message.success(t('app.copySuccess'));
              } catch (err) {
                message.error(t('app.copyFail'));
              }
            }}
            style={{ marginBottom: '8px' }}
          >
            {t('app.copyOfficial')}
          </Button>
          <Button
            className="key-set-btn"
            type="primary"
            block
            onClick={() => {
              const geminiKey =
                localStorage.getItem("gemini-key") || process.env.API_KEY;
              setNewKey(geminiKey || "");
              setIsModalOpen(true);
            }}
            style={{ marginBottom: '8px' }}
          >
            {t('common.settings')} KEY
          </Button>
          <LanguageSwitcher />
        </div>
      </Sider> */}
      {/* <Layout className="main-body">
        <Content style={{ margin: "0" }}>
          <div className="content">
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/GenAIImageStudio" replace />}
              />
              <Route path="/GenAIImageStudio" element={<GenAIImageStudio />} />
              <Route path="/GeminiProductAI" element={<GeminiProductAI />} />
              <Route path="/Cmftransfer" element={<Cmftransfer />} />
              <Route path="/AICameraDirector" element={<AICameraDirector />} />
              <Route
                path="/AILineArtColorizer"
                element={<AILineArtColorizer />}
              />
              <Route path="/VeoStudio" element={<VeoStudio />} />
            </Routes>
          </div>
        </Content>
      </Layout> */}

      <Modal
        title={t("common.settings") + " KEY"}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <TextArea
          rows={4}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
      </Modal>

      {/* 密码验证弹窗 - 无法关闭 */}
      <Modal
        title={null}
        open={!isAuthenticated}
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
        centered
        className="password-modal"
        styles={{
          mask: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: "12px",
            margin: "-24px",
          }}
        >
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2
              style={{
                color: "#fff",
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              万象魔方 AI 工作室
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              请输入访问密码以继续使用
            </p>
          </div>

          <Input.Password
            size="large"
            placeholder="请输入密码"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError("");
            }}
            onPressEnter={handlePasswordSubmit}
            style={{
              marginBottom: "16px",
              background: "rgba(255,255,255,0.1)",
              border: passwordError
                ? "1px solid #ff4d4f"
                : "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          />

          {passwordError && (
            <p
              style={{
                color: "#ff4d4f",
                fontSize: "13px",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              {passwordError}
            </p>
          )}

          <Button
            type="primary"
            size="large"
            block
            onClick={handlePasswordSubmit}
            style={{
              height: "48px",
              fontSize: "16px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
            }}
          >
            验证并进入
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default App;
