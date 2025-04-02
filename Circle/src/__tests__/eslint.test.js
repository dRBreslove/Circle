import { ESLint } from 'eslint';

describe('ESLint Configuration', () => {
  let eslint;

  beforeEach(() => {
    eslint = new ESLint({
      useEslintrc: true,
      cwd: process.cwd(),
      overrideConfig: {
        rules: {
          'import/newline-after-import': 'off',
        },
      },
    });
  });

  test('should pass valid React Native code', async () => {
    const validCode = 
`import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
function TestComponent() {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}
export default TestComponent;
`;

    const results = await eslint.lintText(validCode);
    expect(results[0].messages).toHaveLength(0);
  });

  test('should catch inline styles', async () => {
    const invalidCode = 
`import React from 'react';
import { View, Text } from 'react-native';
function TestComponent() {
  return (
    <View style={{ backgroundColor: '#fff', flex: 1 }}>
      <Text>Hello World</Text>
    </View>
  );
}
export default TestComponent;
`;

    const results = await eslint.lintText(invalidCode);
    expect(results[0].messages).toContainEqual(
      expect.objectContaining({
        ruleId: 'react-native/no-inline-styles',
      })
    );
  });

  test('should catch color literals', async () => {
    const invalidCode = 
`import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
function TestComponent() {
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Text style={{ color: '#ff0000' }}>Hello World</Text>
    </View>
  );
}
export default TestComponent;
`;

    const results = await eslint.lintText(invalidCode);
    expect(results[0].messages).toContainEqual(
      expect.objectContaining({
        ruleId: 'react-native/no-color-literals',
      })
    );
  });

  test('should catch raw text outside Text component', async () => {
    const invalidCode = 
`import React from 'react';
import { View } from 'react-native';
function TestComponent() {
  return (
    <View>
      Hello World
    </View>
  );
}
export default TestComponent;
`;

    const results = await eslint.lintText(invalidCode);
    expect(results[0].messages).toContainEqual(
      expect.objectContaining({
        ruleId: 'react-native/no-raw-text',
      })
    );
  });

  test('should pass with proper Text component usage', async () => {
    const validCode = 
`import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
function TestComponent() {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}
export default TestComponent;
`;

    const results = await eslint.lintText(validCode);
    expect(results[0].messages).toHaveLength(0);
  });
}); 