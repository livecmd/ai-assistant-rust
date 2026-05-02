import {
  CloseOutlined,
  CreditCardOutlined,
  LockOutlined,
  LogoutOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, message } from "antd";
import "./UserInfoModal.less";
import {
  changePasswordApi,
  getPaymentStatus,
  getStatus,
  getTopupInfo,
  getUserInfoApi,
  pay,
  redeemCardApi,
  StatusInfo,
  TopupInfo,
} from "@/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPointsValue, getPointsSettings } from "@/utils/helper";
import { invoke } from "@tauri-apps/api/core";

interface LoginProps {
  onCancel: () => void;
}

interface StoredUserInfo {
  username?: string;
  group?: string;
}

function getStoredUserInfo(): StoredUserInfo {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "{}");
  } catch {
    return {};
  }
}

function formatPlanLabel(group?: string) {
  if (group === "admin") return "ADMIN ACCESS";
  if (group === "premium") return "STANDARD PROFESSIONAL";
  return "STANDARD USER";
}

function splitQuotaDisplay(value: string | number) {
  const quotaText = String(value || 0);
  const matched = quotaText.match(/^([^\d-]+)?(.*)$/);

  return {
    symbol: matched?.[1] || "",
    amount: matched?.[2] || quotaText,
  };
}

function Login(props: LoginProps) {
  const userInfo = getStoredUserInfo();
  const [userData, setUserData] = useState<{ quota: string | number }>({ quota: 0 });
  const [key, setKey] = useState("");
  const [amount, setAmount] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [btnExchangeLoading, setBtnExchangeLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [btnTopupLoading, setBtnTopupLoading] = useState(false);
  const [btnPasswordLoading, setBtnPasswordLoading] = useState(false);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const redeemSuccessTimerRef = useRef<number | null>(null);
  const [topupInfo, setTopupInfo] = useState<TopupInfo>({
    amount_options: [],
    discount: {},
    payment_ready: false,
  });
  const [pointsSettings, setPointsSettings] = useState(() => getPointsSettings());

  useEffect(() => {
    Promise.all([getTopupInfo(), getStatus()]).then(([topupRes, statusRes]) => {
      let mergedStatus: StatusInfo | null = null;

      if (topupRes.success && topupRes.data) {
        setTopupInfo(topupRes.data);
        mergedStatus = { ...(mergedStatus || {}), ...topupRes.data };
      }

      if (statusRes.success && statusRes.data) {
        localStorage.setItem("status", JSON.stringify(statusRes.data));
        mergedStatus = { ...(mergedStatus || {}), ...statusRes.data };
      }

      if (mergedStatus) {
        setPointsSettings(getPointsSettings(mergedStatus));
      }
    });

    getUserInfo();

    return () => {
      if (redeemSuccessTimerRef.current) {
        window.clearTimeout(redeemSuccessTimerRef.current);
      }
    };
  }, []);

  const getUserInfo = async () => {
    const res = await getUserInfoApi();
    if (res.success) {
      setUserData({ quota: res.data.quota ?? 0 });
    } else {
      message.error("余额获取失败！");
    }
  };

  const loginOut = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("gemini-key");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.reload();
  };

  const exchange = async () => {
    if (btnExchangeLoading) return;

    if (!key) {
      message.error("请输入卡密！");
      return;
    }

    setBtnExchangeLoading(true);
    try {
      const res = await redeemCardApi({ key });
      if (res.success) {
        message.success("兑换成功！");
        getUserInfo();
        setKey("");
        setRedeemSuccess(true);
        if (redeemSuccessTimerRef.current) {
          window.clearTimeout(redeemSuccessTimerRef.current);
        }
        redeemSuccessTimerRef.current = window.setTimeout(() => {
          setRedeemSuccess(false);
          redeemSuccessTimerRef.current = null;
        }, 1800);
      } else {
        message.error(res.error || "兑换失败！");
      }
    } catch {
      message.error("兑换失败！");
    } finally {
      setBtnExchangeLoading(false);
    }
  };

  const numericAmount = Number(amount || 0);

  const getDiscountedAmount = (targetAmount: number) => {
    const discount = topupInfo.discount[String(targetAmount)];
    return discount ? targetAmount * discount : targetAmount;
  };

  const topup = async () => {
    if (btnTopupLoading) return;

    if (!numericAmount) {
      message.error("请输入金额！");
      return;
    }
    if (!topupInfo.payment_ready) {
      message.error("支付宝当面付尚未配置完成，请联系管理员");
      return;
    }

    setBtnTopupLoading(true);
    try {
      const res = await pay({
        amount: numericAmount,
        payment_method: "alipay_f2f",
      });

      if (res.success) {
        const orderNo = res.data?.order_no;
        const payUrl =
          res.data?.checkout_url ||
          `${res.url}?order_no=${encodeURIComponent(
            orderNo || ""
          )}&redirect=${encodeURIComponent(res.data?.redirect || "/console/log")}`;

        const paymentResult = await invoke<{
          success: boolean;
          cancelled: boolean;
          final_url: string;
        }>("open_payment_window", {
          payUrl,
          newapiHost: "/console/log",
        });

        if (paymentResult?.success && orderNo) {
          const paid = await pollPaymentStatus(orderNo);
          if (paid) {
            message.success("充值成功！");
            getUserInfo();
            setAmount("");
          } else {
            message.warning("支付结果确认中，请稍后刷新余额");
          }
        }
      } else {
        message.error(res.error || "充值失败！");
      }
    } catch {
      message.error("充值失败！");
    } finally {
      setBtnTopupLoading(false);
    }
  };

  const pollPaymentStatus = async (orderNo: string) => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const res = await getPaymentStatus({ order_no: orderNo });
      if (res.success && res.data?.status === "paid") {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  };

  const topupHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value.replace(/[^0-9]/g, "");
    setAmount(nextValue);
  };

  const resetPasswordFields = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "请输入新密码！";
    }
    if (password.length < 8) {
      return "密码长度不能小于8位！";
    }
    if (password.length > 16) {
      return "密码长度不能大于16位！";
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return "密码只能包含字母和数字！";
    }
    return "";
  };

  const changePassword = async () => {
    if (btnPasswordLoading) return;

    if (!oldPassword) {
      message.error("请输入旧密码！");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      message.error(passwordError);
      return;
    }

    if (newPassword === oldPassword) {
      message.error("新密码不能与旧密码相同！");
      return;
    }

    if (!confirmPassword) {
      message.error("请再次输入新密码！");
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error("两次输入的新密码不一致！");
      return;
    }

    setBtnPasswordLoading(true);
    try {
      const res = await changePasswordApi({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res.success) {
        message.success("密码修改成功！");
        resetPasswordFields();
        setPasswordPanelOpen(false);
      } else {
        message.error(res.error || "密码修改失败！");
      }
    } catch {
      message.error("密码修改失败！");
    } finally {
      setBtnPasswordLoading(false);
    }
  };

  const username = userInfo.username || "用户";
  const planLabel = formatPlanLabel(userInfo.group);
  const pointsName = topupInfo.points_name || pointsSettings.pointsName;
  const quotaDisplay = useMemo(
    () => splitQuotaDisplay(formatPointsValue(userData.quota, pointsName)),
    [pointsName, userData.quota]
  );
  const finalPrice = numericAmount ? getDiscountedAmount(numericAmount).toFixed(2) : "";
  const pointsPerCny = Number(topupInfo.points_per_cny || pointsSettings.pointsPerCny) || pointsSettings.pointsPerCny;
  const pointsTextPerCny = formatPointsValue(pointsPerCny, pointsName);
  const earnedPoints = numericAmount > 0 ? numericAmount * pointsPerCny : 0;

  return (
    <Modal
      title={null}
      open={true}
      footer={null}
      centered
      width="72vw"
      className="user-info-modal"
      maskClosable={false}
      closable={false}
      onCancel={props.onCancel}
    >
      <div className="user-center-shell">
        <div className="user-center-header">
          <div className="title-block">
            <h1>个人中心</h1>
            <p>{passwordPanelOpen ? "更新您的账户登录密码" : "管理您的账户资产与订阅状态"}</p>
          </div>
          <div className="header-actions">
            <button
              className={`header-action ${passwordPanelOpen ? "is-active" : ""}`}
              onClick={() => setPasswordPanelOpen((prev) => !prev)}
            >
              <LockOutlined />
              <span>{passwordPanelOpen ? "返回中心" : "修改密码"}</span>
            </button>
            <button className="header-action subtle" onClick={props.onCancel}>
              <CloseOutlined />
              <span>关闭</span>
            </button>
            <button className="header-action" onClick={loginOut}>
              <LogoutOutlined />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {passwordPanelOpen ? (
          <section className="center-card action-card password-panel">
            <div className="card-head">
              <div className="card-icon">
                <LockOutlined />
              </div>
              <h2>修改密码</h2>
            </div>
            <p className="card-desc">输入当前密码并设置新的登录密码，密码需为 8-16 位字母或数字</p>

            <div className="card-form password-form">
              <Input.Password
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="center-input"
                placeholder="输入当前密码"
                autoComplete="off"
              />
              <Input.Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="center-input"
                placeholder="输入新密码"
                autoComplete="off"
              />
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="center-input"
                placeholder="再次输入新密码"
                autoComplete="off"
                onPressEnter={changePassword}
              />
              <Button
                className="action-button dark"
                onClick={changePassword}
                loading={btnPasswordLoading}
              >
                确认修改
              </Button>
            </div>
          </section>
        ) : (
          <>
            <div className="user-center-grid">
              <section className="center-card profile-card">
                <div className="profile-top">
                  <div className="avatar-frame">
                    <div className="user-avatar">{username.slice(0, 1).toUpperCase()}</div>
                    <span className="online-dot" />
                  </div>
                  <div className="user-name">{username}</div>
                  <div className="user-plan">{planLabel}</div>
                </div>

                <div className="quota-block">
                  <div className="quota-label">剩余{pointsName}</div>
                  <div className="quota-value">
                    {quotaDisplay.symbol && (
                      <span className="quota-symbol">{quotaDisplay.symbol}</span>
                    )}
                    <span>{quotaDisplay.amount}</span>
                  </div>
                </div>
              </section>

              <section className="center-card action-card redeem-card">
                <div className="card-head">
                  <div className="card-icon">
                    <CreditCardOutlined />
                  </div>
                  <h2>卡密兑换</h2>
                </div>
                <p className="card-desc">输入您的礼品卡或兑换码以增加账户余额</p>

                <div className="card-form redeem-form">
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="center-input"
                    placeholder="输入兑换卡密..."
                  />
                  <Button
                    className={`action-button dark ${redeemSuccess ? "is-success" : ""}`}
                    onClick={exchange}
                    loading={btnExchangeLoading}
                  >
                    {redeemSuccess ? "兑换成功" : "兑换"}
                  </Button>
                </div>
              </section>

              <section className="center-card action-card topup-card">
                <div className="card-head">
                  <div className="card-icon">
                    <WalletOutlined />
                  </div>
                  <h2>余额充值</h2>
                </div>
                <p className="card-desc">选择或输入金额进行快速安全支付，当前比例 1 元 = {pointsTextPerCny}</p>

                <div className="card-form">
                  <Input
                    value={amount}
                    onChange={topupHandleChange}
                    className="center-input currency-input"
                    placeholder="输入充值金额"
                    prefix="¥"
                  />
                  <Button
                    className="action-button light"
                    onClick={topup}
                    loading={btnTopupLoading}
                  >
                    支付宝支付
                  </Button>
                </div>

                {numericAmount > 0 && (
                  <div className="payment-summary">
                    <span>充值摘要</span>
                    <div className="summary-price" style={{ flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <strong>实付 ¥{finalPrice}</strong>
                      <strong>到账 {formatPointsValue(earnedPoints, pointsName)}</strong>
                    </div>
                  </div>
                )}

                {!topupInfo.payment_ready && (
                  <div className="payment-warning">
                    后台尚未启用支付宝当面付，暂时不能在线充值。
                  </div>
                )}

                {topupInfo.amount_options.length > 0 && (
                  <div className="topup-options">
                    {topupInfo.amount_options.map((opt) => {
                      const discount = topupInfo.discount[String(opt)];
                      const hasDiscount = Boolean(discount);

                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`option-item ${numericAmount === opt ? "active" : ""}`}
                          onClick={() => setAmount(String(opt))}
                        >
                          <span className="option-main">¥{opt}</span>
                          <span className="option-sub">
                            到账 {formatPointsValue(opt * pointsPerCny, pointsName)}
                            {hasDiscount ? ` · 实付 ¥${getDiscountedAmount(opt).toFixed(2)}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="status-card">
              <div className="status-item">
                <span className="status-label">账户类型</span>
                <strong>{planLabel}</strong>
              </div>
              <div className="status-divider" />
              <div className="status-item">
                <span className="status-label">支付状态</span>
                <div
                  className={`status-indicator ${
                    topupInfo.payment_ready ? "is-ready" : "is-pending"
                  }`}
                >
                  <span className="status-dot" />
                  <strong>{topupInfo.payment_ready ? "稳定" : "未启用"}</strong>
                </div>
              </div>
              <div className="status-divider" />
              <div className="status-item">
                <span className="status-label">充值比例</span>
                <strong>1 元 = {pointsTextPerCny}</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default Login;
