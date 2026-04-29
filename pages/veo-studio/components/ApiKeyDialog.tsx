/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyIcon } from './icons';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center flex flex-col items-center">
        <div className="bg-indigo-600/20 p-4 rounded-full mb-6">
          <KeyIcon className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">需要设置 API Key</h2>
        <p className="text-gray-300 mb-6">
          视频生成功能需要 API Key 才能使用。请点击左侧边栏的「设置 KEY」按钮来配置您的 API Key。
        </p>
        <p className="text-gray-400 mb-8 text-sm">
          设置完成后，点击下方按钮关闭此对话框，然后即可开始生成视频。
        </p>
        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-lg"
        >
          我已了解，关闭此对话框
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
