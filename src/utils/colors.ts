export const BUBBLE_COLORS = [
  '#FF006E',
  '#FB5607',
  '#FFBE0B',
  '#8338EC',
  '#3A86FF',
  '#06FFB4',
  '#FF4365',
  '#00F5FF',
  '#FFDD00',
  '#FF006E'
]

export const getColorForLevel = (level: number): string => {
  return BUBBLE_COLORS[level % BUBBLE_COLORS.length]
}

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}