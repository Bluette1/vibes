import '../global.css';
import { Stack } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

const CustomHeaderTitle = () => {
  return <Text style={styles.title}></Text>;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
});

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <CustomHeaderTitle />,
          headerStyle: { backgroundColor: '#f8f8f8' },
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
}
