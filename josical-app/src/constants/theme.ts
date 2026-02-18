export const colors = {
  primary: '#F5A623',
  primaryLight: '#FFF8EC',
  primaryDark: '#D4891A',
  text: '#3D2C1E',
  textSecondary: '#8A7A6D',
  textLight: '#B5A99A',
  background: '#FAFAF8',
  backgroundSecondary: '#F5F3F0',
  surface: '#FFFFFF',
  border: '#EDE8E3',
  borderLight: '#F3EFE9',
  error: '#E74C3C',
  errorLight: '#FDF3F2',
  success: '#2ECC71',
  successLight: '#EAFAF3',
  white: '#FFFFFF',
  black: '#1A1A1A',
  overlay: 'rgba(61, 44, 30, 0.5)',
  gray: {
    50: '#FAFAF9',
    100: '#F5F3F0',
    200: '#EDE8E3',
    300: '#DDD6CE',
    400: '#C4BAB0',
    500: '#9E9087',
    600: '#7A6E66',
    700: '#5E5249',
    800: '#3D3028',
    900: '#1E150E',
  },
  message: {
    sent: '#F5A623',
    sentText: '#FFFFFF',
    received: '#F0EDE8',
    receivedText: '#3D2C1E',
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
  display: 40,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
}

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const

export const shadow = {
  xs: {
    shadowColor: '#3D2C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#3D2C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#3D2C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3D2C1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#3D2C1E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
} as const

export const hitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const
