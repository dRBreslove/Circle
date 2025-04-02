// Color constants for the application
export const colors = {
  primary: {
    main: '#007AFF',
    light: '#4CAF50',
    dark: '#2196F3',
    danger: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3'
  },
  secondary: {
    main: '#666666',
    light: '#999999',
    dark: '#333333'
  },
  accent: {
    blue: '#007AFF',
    red: '#FF3B30',
    green: '#34C759',
    yellow: '#FFCC00'
  },
  status: {
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    pending: '#FFC107',
    active: '#4CAF50'
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F5F5F5',
    gray100: '#F0F0F0',
    gray200: '#E0E0E0',
    gray300: '#DDD',
    gray400: '#CCCCCC',
    gray500: '#999999',
    gray600: '#666666',
    gray700: '#333333',
    gray800: '#1A1A1A',
    gray900: '#000000'
  },
  background: {
    primary: '#F5F5F5',
    secondary: '#FFFFFF',
    tertiary: '#F8F9FA',
    overlay: {
      light: 'rgba(255, 255, 255, 0.8)',
      medium: 'rgba(255, 255, 255, 0.5)',
      dark: 'rgba(0, 0, 0, 0.5)',
      darker: 'rgba(0, 0, 0, 0.7)',
      darkest: 'rgba(0, 0, 0, 0.9)'
    }
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#FFFFFF'
  },
  border: {
    light: '#E0E0E0',
    main: '#DDD',
    dark: '#CCCCCC'
  },
  shadow: {
    main: 'rgba(0, 0, 0, 0.1)',
    light: 'rgba(0, 0, 0, 0.05)',
    dark: 'rgba(0, 0, 0, 0.2)'
  }
};

// Helper functions
export const getColorByStatus = (status) => {
  switch (status) {
    case 'healthy':
      return colors.status.success;
    case 'error':
      return colors.status.error;
    case 'warning':
      return colors.status.warning;
    default:
      return colors.text.secondary;
  }
};

export const getColorBySeverity = (severity) => {
  switch (severity) {
    case 'high':
      return colors.status.error;
    case 'medium':
      return colors.status.warning;
    case 'low':
      return colors.status.info;
    default:
      return colors.text.secondary;
  }
};

// Common style patterns
export const commonStyles = {
  shadow: {
    shadowColor: colors.shadow.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 8,
    ...commonStyles.shadow,
  },
  
  text: {
    primary: {
      color: colors.text.primary,
    },
    secondary: {
      color: colors.text.secondary,
    },
    light: {
      color: colors.text.light,
    },
  },
  
  border: {
    light: {
      borderColor: colors.border.light,
      borderWidth: 1,
    },
    regular: {
      borderColor: colors.border.dark,
      borderWidth: 1,
    },
    dark: {
      borderColor: colors.border.dark,
      borderWidth: 1,
    },
  },
}; 