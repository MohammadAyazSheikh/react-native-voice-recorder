import { StyleSheet, Text, View } from 'react-native';
import SoundRecorder from './components/recorder/recorder';

export default function App() {
  return (
    <View style={styles.container}>
      <SoundRecorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
