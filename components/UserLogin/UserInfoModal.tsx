import { Button, Input, Modal, Space, message, Tag } from "antd";
import "./UserInfoModal.less";
import { getPaymentStatus, getTopupInfo, getUserInfoApi, pay, redeemCardApi } from "@/api";
import { useEffect, useState } from "react";
import { renderQuota } from "@/utils/helper";
import { invoke } from '@tauri-apps/api/core';

interface LoginProps {
  onCancel: () => void;
}
function Login(props: LoginProps) {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const [userData, setUserData] = useState({ quota: 0 });
  const [key, setKey] = useState("");
  const [amount, setAmount] = useState(0);
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
    // 0. 获取充值配置信息
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
    // 清除cookie
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
      const res = await redeemCardApi({
        key: key,
      });
      console.log("res", res);
      if (res.success) {
        message.success("兑换成功！");
        getUserInfo();
      } else {
        message.error(res.error || "兑换失败！");
      }
      setBtnExchangeLoading(false);
    } catch (error) {
      message.error("兑换失败！");
      setBtnExchangeLoading(false);
    } finally {
      setBtnExchangeLoading(false);
    }
  };

  const topup = async () => {
    if (btnTopupLoading) return;

    if (!amount) {
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
        amount: amount,
        payment_method: "alipay_f2f",
      });
      if (res.success) {
        const orderNo = res.data?.order_no;
        const payUrl = res.data?.checkout_url || `${res.url}?order_no=${encodeURIComponent(orderNo || "")}&redirect=${encodeURIComponent(res.data?.redirect || "/console/log")}`;
        const paymentResult = await invoke<{ success: boolean; cancelled: boolean; final_url: string }>('open_payment_window', {
          payUrl: payUrl,
          newapiHost: "/console/log"
        });
        if (paymentResult?.success && orderNo) {
          const paid = await pollPaymentStatus(orderNo);
          if (paid) {
            message.success("充值成功！");
            getUserInfo();
          } else {
            message.warning("支付结果确认中，请稍后刷新余额");
          }
        }
      } else {
        message.error(res.error || "充值失败！");
      }
      setBtnTopupLoading(false);
    } catch (error) {
      message.error("充值失败！");
      setBtnTopupLoading(false);
    } finally {
      setBtnTopupLoading(false);
    }
  }

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
    const val = e.target.value;
    // 移除非数字字符
    const nextValue = val.replace(/[^0-9]/g, '');
    setAmount(Number(nextValue));
  };

  const username = userInfo.username || "";

  return (
    <Modal
      title={"用户信息"}
      open={true}
      footer={null}
      centered
      className="login-modal"
      maskClosable={false}
      onCancel={props.onCancel}
    >
      <div className="login-container">
        <div className="user-info">
          <div className="user-avatar">{username.slice(0, 1)}</div>
          <div className="user-name">{username}</div>
        </div>
        <div className="user-quota">
          <img className="quota-icon" src="/quota.png" alt="" />
          <span className="quota-text">剩余余额：{userData.quota || 0}</span>
        </div>
        <div className="secret-box">
          <div className="secret-text">卡密</div>
          <div>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="secret-input"
                placeholder="请输入您的卡密"
              />
              <Button className="secret-button" onClick={exchange}>
                兑换
              </Button>
            </Space.Compact>
          </div>
        </div>
        <div className="secret-box">
          <div className="secret-text">充值</div>
          <div>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={amount}
                onChange={topupHandleChange}
                className="secret-input"
                placeholder="请输入充值金额（单位人民币）"
              />
              <Button className="secret-button" onClick={topup} loading={btnTopupLoading}>
                支付宝支付
              </Button>
            </Space.Compact>

            {!topupInfo.payment_ready && (
              <div style={{ marginTop: 10, color: '#ef4444', fontSize: 12 }}>
                后台尚未启用支付宝当面付，暂时不能在线充值。
              </div>
            )}

            {/* Price Summary */}
            {amount > 0 && (
                <div className="payment-summary">
                    <span className="label">实付金额:</span>
                    <div className="final-price">
                      <span>¥</span>
                        {(topupInfo.discount[String(amount)] 
                            ? amount * topupInfo.discount[String(amount)] 
                            : amount
                        ).toFixed(2)}
                        {topupInfo.discount[String(amount)] && (
                             <span style={{textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontSize: 12}}>
                          ¥{amount}
                             </span>
                        )}
                    </div>
                </div>
            )}
            
            {/* Quick Options Grid */}
            {topupInfo.amount_options.length > 0 && (
              <div className="topup-options">
                {topupInfo.amount_options.map((opt) => {
                  const hasDiscount = !!topupInfo.discount[String(opt)];
                  let discountText = "";
                  if (hasDiscount) {
                    const discountVal = topupInfo.discount[String(opt)];
                    discountText = `${(discountVal * 10).toFixed(1).replace(/\.0$/, "")}折`;
                  }
                  
                  return (
                    <div 
                        key={opt}
                        className={`option-item ${amount === opt ? 'active' : ''}`}
                        onClick={() => setAmount(opt)}
                    >
                        {hasDiscount && <div className="discount-tag">{discountText}</div>}
                      <div className="option-amount">¥{opt}</div>
                        {hasDiscount && (
                            <div className="option-discount">
                          ¥{(opt * topupInfo.discount[String(opt)]).toFixed(2)}
                            </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="login-button" onClick={loginOut}>
          退出登录
        </div>
      </div>
    </Modal>
  );
}

export default Login;
