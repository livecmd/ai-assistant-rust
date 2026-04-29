/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Warming up the digital director...",
  "Gathering pixels and photons...",
  "Storyboarding your vision...",
  "Consulting with the AI muse...",
  "Rendering the first scene...",
  "Applying cinematic lighting...",
  "This can take a few minutes, hang tight!",
  "Adding a touch of movie magic...",
  "Composing the final cut...",
  "Polishing the masterpiece...",
  "Teaching the AI to say 'I'll be back'...",
  "Checking for digital dust bunnies...",
  "Calibrating the irony sensors...",
  "Untangling the timelines...",
  "Enhancing to ludicrous speed...",
  "Don't worry, the pixels are friendly.",
  "Harvesting doubao image stems...",
  "Praying to the Gemini star...",
  "Starting a draft for your oscar speech..."
];

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
  variant?: 'default' | 'minimal' | 'pulse';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  showMessage = true,
  variant = 'default'
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!showMessage) return;

    const intervalId = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        setIsVisible(true);
      }, 300);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [showMessage]);

  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClasses[size]} border-t-transparent border-indigo-500 rounded-full animate-spin`}></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className={`${sizeClasses[size]} bg-indigo-500/20 rounded-full animate-ping absolute inset-0`}></div>
          <div className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full animate-pulse relative`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fadeIn">
      {/* Animated Spinner with Glow */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-t-transparent border-indigo-500/30 rounded-full absolute inset-0 animate-spin`} style={{ animationDuration: '3s' }}></div>
        <div className={`${sizeClasses[size]} border-t-transparent border-indigo-500 rounded-full animate-spin relative`}></div>
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
      </div>

      {showMessage && (
        <>
          <h2 className={`${textSizes[size]} font-semibold mt-6 text-gray-200 animate-pulse`}>
            Generating...
          </h2>
          <p className={`mt-2 text-gray-400 text-center text-sm max-w-xs transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            {loadingMessages[messageIndex]}
          </p>
        </>
      )}
    </div>
  );
};

export default LoadingIndicator;
