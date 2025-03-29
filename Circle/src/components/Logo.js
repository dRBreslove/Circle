import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Animated, useColorScheme, ViewStyle } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Logo component that displays the Circle app logo with animation effects.
 * Supports both light and dark mode variants.
 * 
 * @component
 * @example
 * ```jsx
 * // Basic usage
 * <Logo />
 * 
 * // Custom size
 * <Logo size={100} />
 * 
 * // With custom style
 * <Logo style={{ marginTop: 20 }} />
 * ```
 */
const Logo = ({ size = 150, style }) => {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  /**
   * Sets up and manages the logo animation sequence.
   * Creates a parallel animation of fade-in and scale effects.
   * Cleans up animation on component unmount.
   */
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [fadeAnim, scaleAnim]);

  /**
   * Determines which logo variant to display based on the system color scheme.
   * 
   * @returns {number} The image source for the appropriate logo variant
   */
  const getLogoSource = () => {
    if (colorScheme === 'dark') {
      return require('../assets/images/circle-app-logo-dark.png');
    }
    return require('../assets/images/circle-app-logo.png');
  };

  return (
    <Animated.View
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Image 
        source={getLogoSource()}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

/**
 * PropTypes for the Logo component
 */
Logo.propTypes = {
  /** Size of the logo in pixels (width and height) */
  size: PropTypes.number,
  /** Additional styles to apply to the logo container */
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object),
  ]),
};

/**
 * Default props for the Logo component
 */
Logo.defaultProps = {
  size: 150,
  style: {},
};

/**
 * Styles for the Logo component
 */
const styles = StyleSheet.create({
  logo: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Logo; 