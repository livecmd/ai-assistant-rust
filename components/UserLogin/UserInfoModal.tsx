import {
  CloseOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, message } from "antd";
import "./UserInfoModal.less";
import {
  getPaymentStatus,
  getTopupInfo,
  getUserInfoApi,
  pay,
  redeemCardApi,
} from "@/api";
import { useEffect, useMemo, useState } from "react";
import { renderQuota } from "@/utils/helper";
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
  const [btnExchangeLoading, setBtnExchangeLoading] = useState(false);
  const [btnTopupLoading, setBtnTopupLoading] = useState(false);
  const [topupInfo, setTopupInfo] = useState<{
    amount_options: number[];
    discount: Record<string, number>;
    payment_ready?: boolean;
  }>({
    amount_options: [],
    discount: {},
    payment_ready: false,
  });

  useEffect(() => {
    getTopupInfo().then((res) => {
      if (res.success && res.data) {
        setTopupInfo(res.data);
      }
    });

    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const res = await getUserInfoApi();
    if (res.success) {
      setUserData({ quota: renderQuota(res.data.quota) });
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

  const username = userInfo.username || "用户";
  const planLabel = formatPlanLabel(userInfo.group);
  const quotaDisplay = useMemo(() => splitQuotaDisplay(userData.quota), [userData.quota]);
  const finalPrice = numericAmount ? getDiscountedAmount(numericAmount).toFixed(2) : "";
  const hasAmountDiscount = Boolean(topupInfo.discount[String(numericAmount)]);

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
            <p>管理您的账户资产与订阅状态</p>
          </div>
          <div className="header-actions">
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
              <div className="quota-label">剩余余额</div>
              <div className="quota-value">
                {quotaDisplay.symbol && (
                  <span className="quota-symbol">{quotaDisplay.symbol}</span>
                )}
                <span>{quotaDisplay.amount}</span>
              </div>
            </div>
          </section>

          <section className="center-card action-card">
            <div className="card-head">
              <div className="card-icon">
                <CreditCardOutlined />
              </div>
              <h2>卡密兑换</h2>
            </div>
            <p className="card-desc">输入您的礼品卡或兑换码以增加账户余额</p>

            <div className="card-form">
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="center-input"
                placeholder="输入兑换卡密..."
              />
              <Button
                className="action-button dark"
                onClick={exchange}
                loading={btnExchangeLoading}
              >
                兑换
              </Button>
            </div>
          </section>

          <section className="center-card action-card">
            <div className="card-head">
              <div className="card-icon">
                <WalletOutlined />
              </div>
              <h2>余额充值</h2>
            </div>
            <p className="card-desc">选择或输入金额进行快速安全支付</p>

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
                <span>实付金额</span>
                <div className="summary-price">
                  <strong>¥{finalPrice}</strong>
                  {hasAmountDiscount && <em>¥{numericAmount}</em>}
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
                      {hasDiscount && (
                        <span className="option-sub">¥{getDiscountedAmount(opt).toFixed(2)}</span>
                      )}
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
            <span className="status-label">充值档位</span>
            <strong>{topupInfo.amount_options.length || 0} 个</strong>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default Login;
