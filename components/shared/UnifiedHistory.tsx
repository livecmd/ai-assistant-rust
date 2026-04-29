import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Modal, message } from "antd";
import "./UnifiedHistory.less";
import { DeleteOutlined } from "@ant-design/icons";

export interface HistoryItemProps {
  id: string;
  thumbnail: string; // URL or Base64
  type: "image" | "video";
  label?: string;
  isActive?: boolean;
  timestamp?: number;
  onClick?: () => void;
}

interface UnifiedHistoryProps {
  items: HistoryItemProps[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  title?: string;
  emptyMessage?: string;
  visibleCount?: number; // 每页显示的项目数量
  isVideo?: boolean;
}

export const UnifiedHistory: React.FC<UnifiedHistoryProps> = ({
  items,
  activeId,
  onSelect,
  onDelete,
  title,
  emptyMessage = "NO HISTORY",
  visibleCount = 4,
  isVideo = false,
}) => {
  // State for responsive visible count
  const [itemsPerPage, setItemsPerPage] = useState(visibleCount);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);

  // Update itemsPerPage based on container width
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (!itemsContainerRef.current) return;
      const containerWidth = itemsContainerRef.current.clientWidth;
      const windowWidth = window.innerWidth;
      
      // Calculate item width based on CSS breakpoints in shared.less
      // > 1024px: 162 + 10 = 172
      // <= 1024px: 140 + 10 = 150
      // <= 768px: 120 + 8 = 128
      // <= 480px: 95 + 6 = 101
      let itemWidth = 172;
      if (windowWidth <= 480) itemWidth = 101;
      else if (windowWidth <= 768) itemWidth = 128;
      else if (windowWidth <= 1024) itemWidth = 150;

      const count = Math.floor(containerWidth / itemWidth);
      setItemsPerPage(count > 0 ? count : 1);
    };

    // Initial calculation
    calculateItemsPerPage();

    const observer = new ResizeObserver(() => {
      calculateItemsPerPage();
    });

    if (itemsContainerRef.current) {
      observer.observe(itemsContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  console.log('items:', items)

  // 计算总页数
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // 当前页显示的项目
  const startIndex = currentPage * itemsPerPage;
  const displayItems = items.slice(startIndex, startIndex + itemsPerPage);

  // 是否可以前后翻页
  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;

  const [showMore, setShowMore] = useState(false);

  // 当 items 变化时，确保 currentPage 有效
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [items.length, totalPages, currentPage]);

  // 翻页函数
  const goToPage = (direction: "left" | "right") => {
    if (direction === "left" && canGoLeft) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === "right" && canGoRight) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDownloadItem = (e: React.MouseEvent, item: HistoryItemProps) => {
    e.stopPropagation();
    if (item.thumbnail) {
      message.success(`${item.type === 'video' ? '视频' : '图片'}已开始下载，请查看您的下载文件夹`);
      const link = document.createElement('a');
      link.href = item.thumbnail;
      link.download = `history-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bot group/history history-container">
      {!isVideo && (
        <div className="play">
          <img
            src="/4.svg"
            alt="Play"
            className="w-6 h-6"
            onClick={() => setShowMore(true)}
            onError={(e) => {
              // Fallback if generic asset is missing
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML =
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>';
            }}
          />
        </div>
      )}
      {/* Left Arrow Button */}
      <button
        onClick={() => goToPage("left")}
        disabled={!canGoLeft}
        className={`play hover:scale-110 transition-all duration-200 cursor-pointer ${
          !canGoLeft
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-indigo-500/20"
        }`}
      >
        <ChevronLeft size={24} className="text-white" />
      </button>

      {/* Items Container */}
      <div className="items" ref={itemsContainerRef}>
        {items.length === 0 && (
          <div className="h-full flex items-center justify-center px-4 text-slate-500 text-xs italic tracking-wider animate-pulse">
            {emptyMessage}
          </div>
        )}
        {displayItems.map((item, index) => (
          <div
            key={item.id}
            className={`item relative group/item overflow-hidden cursor-pointer animate-fadeIn ${
              item.isActive || item.id === activeId ? "active" : ""
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onSelect(item.id)}
          >
            {item.type === "video" ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                {item.thumbnail ? (
                  <video
                    src={item.thumbnail}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                  />
                ) : (
                  <Play size={24} className="text-slate-500" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/item:bg-black/50 transition-colors">
                  <Play
                    size={20}
                    className="text-white fill-white/50 group-hover/item:scale-125 transition-transform"
                  />
                </div>
              </div>
            ) : (
              <img
                src={item.thumbnail}
                alt="History"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
              />
            )}

            {/* Active/Hover Border */}
            <div
              className={`absolute inset-0 border-2 transition-all duration-300 pointer-events-none ${
                item.isActive || item.id === activeId
                  ? "border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.3)]"
                  : "border-transparent group-hover/item:border-indigo-400/60"
              }`}
            ></div>

            {/* Action Buttons */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-10">
              <button
                className="p-1.5 bg-black/60 hover:bg-indigo-500 rounded-lg text-white backdrop-blur-sm hover:scale-110 active:scale-95"
                onClick={(e) => handleDownloadItem(e, item)}
                title="Download"
              >
                <Download size={12} />
              </button>
              {onDelete && (
                <button
                  className="p-1.5 bg-black/60 hover:bg-red-500 rounded-lg text-white backdrop-blur-sm hover:scale-110 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id, e);
                  }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Label */}
            {item.label && (
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-[10px] text-white/80 truncate block">
                  {item.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right Arrow Button */}
      <button
        onClick={() => goToPage("right")}
        disabled={!canGoRight}
        className={`next hover:scale-110 transition-all duration-200 cursor-pointer ${
          !canGoRight
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-indigo-500/20"
        }`}
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* Page Indicator */}
      {totalPages > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                idx === currentPage ? "bg-indigo-500 w-3" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* show more modal */}
      <Modal
        title="全部"
        width={"90%"}
        open={showMore}
        onCancel={() => setShowMore(false)}
        footer={null}
        className="show-more-modal"
        centered={true}
      >
        <div className="image-list">
          {items &&
            items.length > 0 &&
            items.map((item, index) => (
              <div
                key={index}
                className={`item relative group/item overflow-hidden cursor-pointer animate-fadeIn ${
                  item.isActive || item.id === activeId ? "active" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  onSelect(item.id);
                  setShowMore(false);
                }}
              >
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 z-10">
                  <div
                    className="w-[30px] h-[30px] flex items-center justify-center bg-gray-200/20 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors backdrop-blur-md"
                    onClick={(e) => handleDownloadItem(e, item)}
                    title="Download"
                  >
                    <Download size={14} className="text-white" />
                  </div>
                  {onDelete && (
                    <div
                      className="w-[30px] h-[30px] flex items-center justify-center bg-gray-200/20 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors backdrop-blur-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id, e);
                      }}
                      title="Delete"
                    >
                      <DeleteOutlined className="text-white hover:text-red-500" />
                    </div>
                  )}
                </div>

                {item.type === "video" ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                    {item.thumbnail ? (
                      <video
                        src={item.thumbnail}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                      />
                    ) : (
                      <Play size={24} className="text-slate-500" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/item:bg-black/50 transition-colors">
                      <Play
                        size={20}
                        className="text-white fill-white/50 group-hover/item:scale-125 transition-transform"
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.thumbnail}
                    alt="History"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                  />
                )}
              </div>
            ))}
        </div>
      </Modal>
    </div>
  );
};
