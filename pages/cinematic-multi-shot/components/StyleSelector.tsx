
import React from 'react';
import { ArtStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: ArtStyle;
  onSelect: (style: ArtStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect }) => {
  const styles = [
    {
      type: ArtStyle.MATCH_SOURCE,
      label: '和原图风格一致',
      icon: 'fa-clone',
      desc: 'Inherit original medium'
    },
    {
      type: ArtStyle.REALISTIC,
      label: '写实摄影',
      icon: 'fa-camera-retro',
      desc: 'Photorealistic output'
    },
    {
      type: ArtStyle.REFERENCE_AESTHETIC,
      label: '参考图风格',
      icon: 'fa-wand-magic-sparkles',
      desc: 'Enhanced ref aesthetic'
    },
  ];

  return (
    <div className="cinema-style-selector space-y-4 blobk-bg">
      <label className="cinema-section-label">生成风格(Generation Style)</label>
      <div className="cinema-style-selector__list">
        {styles.map((style) => (
          <button
            key={style.type}
            onClick={() => onSelect(style.type)}
            className={`cinema-style-option ${selectedStyle === style.type ? 'is-active' : ''}`}
          >
            <div className={`cinema-style-option__icon ${selectedStyle === style.type ? 'is-active' : ''}`}>
              <i
                className={`fas ${style.icon} cinema-style-option__icon-mark ${selectedStyle === style.type ? 'is-active' : ''}`}
              ></i>
            </div>
            <div className="cinema-style-option__content">
              <span className="cinema-style-option__title">
                {style.label}
              </span>
              <span className="cinema-style-option__desc">
                {style.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
