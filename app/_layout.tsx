import '../global.css';
import { Stack } from 'expo-router';
import { Text, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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
  container: {
    flex: 1,
    padding: isMobile ? 0 : 20,
    margin: isMobile ? 0 : 10,
    backgroundColor: '#ffffff',
  },
});

export default function Layout() {
  return (
    <View style={styles.container}>
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
    </View>
  );
}
