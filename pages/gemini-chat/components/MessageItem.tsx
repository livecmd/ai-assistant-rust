import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { Message } from "../types";
import clsx from "clsx";

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "flex gap-4 p-6 w-full max-w-4xl mx-auto",
        isUser ? "bg-transparent" : "bg-slate-800/50 rounded-xl"
      )}
    >
      <div
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-blue-600" : "bg-emerald-600"
        )}
      >
        {isUser ? <User size={18} text-white /> : <Bot size={18} text-white />}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="font-semibold text-sm text-slate-300 mb-1">
          {isUser ? "You" : "Gemini"}
        </div>
        <div className="prose prose-invert prose-slate max-w-none text-slate-100 leading-7">
          {/* ReactMarkdown 用于渲染 AI 返回的代码块和格式 */}
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
