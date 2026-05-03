export type AdherencePresetId = "strict" | "balanced" | "creative";

export interface AdherencePreset {
  id: AdherencePresetId;
  label: string;
  description: string;
  value: number;
}

export const CMF_ADHERENCE_PRESETS: AdherencePreset[] = [
  {
    id: "strict",
    label: "严格遵循",
    description: "复制纹理",
    value: 0,
  },
  {
    id: "balanced",
    label: "平衡",
    description: "自然融合",
    value: 50,
  },
  {
    id: "creative",
    label: "创意适配",
    description: "根据产品重绘",
    value: 100,
  },
];

export const DEFAULT_ADHERENCE_LEVEL =
  CMF_ADHERENCE_PRESETS[1].value;

export const getAdherencePreset = (level: number): AdherencePreset => {
  return CMF_ADHERENCE_PRESETS.reduce((closest, current) => {
    const currentDistance = Math.abs(current.value - level);
    const closestDistance = Math.abs(closest.value - level);
    return currentDistance < closestDistance ? current : closest;
  }, CMF_ADHERENCE_PRESETS[0]);
};

export const normalizeAdherenceLevel = (level: number): number => {
  return getAdherencePreset(level).value;
};
