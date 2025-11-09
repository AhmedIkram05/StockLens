/**
 * Color Palette - Core color definitions for light and dark modes
 * 
 * Features:
 * - palette: Primary brand colors and neutrals
 * - alpha: Semi-transparent black variants for overlays and shadows
 * 
 * Color System:
 * - green (#10b981): Primary actions, headers, success states
 * - blue (#007AFF): Secondary actions, accents, links
 * - red (#FF3B30): Errors, destructive actions, warnings
 * - black (#000000): Text in light mode, backgrounds in dark mode
 * - white (#ffffff): Backgrounds in light mode, text in dark mode
 * - lightGray (#f5f5f5): Page backgrounds in light mode, cards in dark mode
 * 
 * Alpha Variants:
 * - subtleBlack (0.6): Muted text, secondary information
 * - mutedBlack (0.4): Placeholder text, disabled states
 * - faintBlack (0.1): Subtle borders, dividers
 * - overlayBlack (0.5): Modal overlays, dimmed backgrounds
 * - deepBlack (0.8): Heavy overlays, loading screens
 * 
 * Integration:
 * - Used by theme.ts for surface and typography definitions
 * - Used by ThemeContext for light/dark mode switching
 * - Strictly enforced per project requirements (no custom colors)
 * 
 * Note:
 * These are the ONLY colors allowed in the app. Do not add custom colors
 * without updating the project requirements documentation.
 */

/**
 * palette - Primary color definitions
 * 
 * All colors are hex strings for consistency with React Native StyleSheet
 */
export const palette = {
  green: '#10b981',
  blue: '#007AFF',
  red: '#FF3B30',
  black: '#000000',
  white: '#ffffff',
  lightGray: '#f5f5f5',
};

/**
 * alpha - Semi-transparent black variants
 * 
 * RGBA format for overlay, shadow, and muted UI elements
 * All variants use black (0, 0, 0) with varying opacity
 */
export const alpha = {
  subtleBlack: 'rgba(0, 0, 0, 0.6)',
  mutedBlack: 'rgba(0, 0, 0, 0.4)',
  faintBlack: 'rgba(0, 0, 0, 0.1)',
  overlayBlack: 'rgba(0, 0, 0, 0.5)',
  deepBlack: 'rgba(0, 0, 0, 0.8)',
};
