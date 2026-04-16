import { COLOR, Font } from './variable';

// Base HTML rendering configuration
export const getHtmlBaseStyle = (
  fontSize: number = 20,
  lineHeight: number = 30,
  textColor?: string,
) => ({
  fontSize,
  lineHeight,
  textAlign: 'left' as const,
  color: textColor || COLOR.Primary,
  fontFamily: Font.Helvetica,
});

// HTML tags styles configuration
export const getHtmlTagsStyles = (
  fontSize: number = 20,
  lineHeight: number = 30,
  textColor?: string,
) => ({
  body: {
    fontSize,
    color: textColor || COLOR.Primary,
    fontFamily: Font.Helvetica,
  },
  p: {
    fontSize,
    lineHeight,
    marginBottom: 16,
    marginTop: 0,
    textAlign: 'left' as const,
    color: textColor || COLOR.Primary,
    fontFamily: Font.Helvetica,
  },
  ul: {
    marginBottom: 16,
    marginTop: 8,
    paddingLeft: 20,
    listStyleType: 'disc' as const,
  },
  ol: {
    marginBottom: 16,
    marginTop: 8,
    paddingLeft: 20,
    listStyleType: 'decimal' as const,
  },
  li: {
    fontSize,
    lineHeight,
    marginBottom: 8,
    textAlign: 'left' as const,
    color: textColor || COLOR.Primary,
    fontFamily: Font.Helvetica,
  },
  strong: {
    fontWeight: '700' as const,
    fontFamily: Font.HelveticaBold,
    color: textColor || COLOR.Primary,
  },
  em: {
    fontStyle: 'italic' as const,
    color: textColor || COLOR.Primary,
  },
  h1: {
    fontSize: Math.round(fontSize * 1.4),
    fontWeight: '700' as const,
    fontFamily: Font.HelveticaBold,
    marginBottom: 16,
    marginTop: 8,
    color: textColor || COLOR.Primary,
  },
  h2: {
    fontSize: Math.round(fontSize * 1.2),
    fontWeight: '700' as const,
    fontFamily: Font.HelveticaBold,
    marginBottom: 14,
    marginTop: 8,
    color: textColor || COLOR.Primary,
  },
  h3: {
    fontSize: Math.round(fontSize * 1.1),
    fontWeight: '700' as const,
    fontFamily: Font.HelveticaBold,
    marginBottom: 12,
    marginTop: 8,
    color: textColor || COLOR.Primary,
  },
});

// HTML renderers props configuration
export const getHtmlRenderersProps = (
  fontSize: number = 20,
  lineHeight: number = 30,
  textColor?: string,
) => ({
  ul: {
    markerTextStyle: {
      fontSize,
      lineHeight,
      color: textColor || COLOR.Primary,
    },
  },
  ol: {
    markerTextStyle: {
      fontSize,
      lineHeight,
      color: textColor || COLOR.Primary,
      fontFamily: Font.Helvetica,
    },
  },
});

// System fonts for RenderHtml
export const htmlSystemFonts = [Font.Helvetica, Font.HelveticaBold];

// Complete HTML config helper
export const getHtmlConfig = (
  fontSize: number = 20,
  lineHeight: number = 30,
  textColor?: string,
) => ({
  baseStyle: getHtmlBaseStyle(fontSize, lineHeight, textColor),
  tagsStyles: getHtmlTagsStyles(fontSize, lineHeight, textColor),
  renderersProps: getHtmlRenderersProps(fontSize, lineHeight, textColor),
  systemFonts: htmlSystemFonts,
  enableExperimentalMarginCollapsing: true,
});
