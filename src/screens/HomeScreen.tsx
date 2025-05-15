import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mushroom Identifier</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Camera')}
        >
          <Icon name="camera-alt" size={48} color="#4CAF50" />
          <Text style={styles.cardTitle}>Identify Mushroom</Text>
          <Text style={styles.cardDescription}>
            Take a photo of a mushroom to identify it
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Collection')}
        >
          <Icon name="collections" size={48} color="#4CAF50" />
          <Text style={styles.cardTitle}>My Collection</Text>
          <Text style={styles.cardDescription}>
            View your identified mushrooms
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Map')}
        >
          <Icon name="map" size={48} color="#4CAF50" />
          <Text style={styles.cardTitle}>Mushroom Map</Text>
          <Text style={styles.cardDescription}>
            View mushrooms on a map
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This app is for educational purposes only. Always consult with experts before consuming any wild mushrooms.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  signOutButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginTop: 18,
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 15,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 22,
  },
  disclaimer: {
    backgroundColor: '#FFECB3',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  disclaimerText: {
    color: '#E65100',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default HomeScreen; 