// Mock the react-native-reanimated library
jest.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
    createAnimatedComponent: (component) => component,
  },
})); 