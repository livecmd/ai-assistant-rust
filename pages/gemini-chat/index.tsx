import { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import MessageItem from "./components/MessageItem";
import InputArea from "./components/InputArea";
import { GeminiModelVersion, Message } from "./types";
import { sendMessageToGemini } from "./services/gemini";
import "./index.less";

function App() {
  const [model, setModel] = useState<GeminiModelVersion>("gemini-2.5-flash");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // 用于自动滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    // 1. 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 准备历史记录格式 (Gemini SDK 需要 specific format)
      const history = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      // 2. 调用 API
      const responseText = await sendMessageToGemini(model, text, history);

      // 3. 添加 AI 消息
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "抱歉，出现了一些错误，请检查 API Key 或网络连接。",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-100 font-sans chat-container">
      <Header currentModel={model} setModel={setModel} />

      {/* 聊天区域 - 减去头部和底部的高度 */}
      <main className="flex-1 chat-main">
        <div className="overflow-y-auto custom-scrollbar chat-main-scroll">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-4xl mb-4 opacity-20">✨</div>
              <p>选择一个模型并开始聊天吧</p>
            </div>
          ) : (
            messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
          )}
          {loading && (
            <div className="flex justify-center p-4">
              <span className="animate-pulse text-slate-500">
                Gemini 正在思考...
              </span>
            </div>
          )}
          {/* 锚点用于自动滚动 */}
          <div ref={messagesEndRef} />
        </div>

        <InputArea onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}

export default App;
