import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { getCollection, deleteFromCollection, SavedMushroom } from '../services/collectionService';
import Icon from 'react-native-vector-icons/MaterialIcons';

type CollectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Collection'>;
  route: RouteProp<RootStackParamList, 'Collection'>;
};

const CollectionScreen: React.FC<CollectionScreenProps> = ({ navigation }) => {
  const [mushrooms, setMushrooms] = useState<SavedMushroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const collection = await getCollection();
      setMushrooms(collection);
    } catch (err) {
      setError('Failed to load collection. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mushroomId: string, imageUri: string) => {
    Alert.alert(
      'Delete Mushroom',
      'Are you sure you want to delete this mushroom from your collection?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFromCollection(mushroomId, imageUri);
              setMushrooms(mushrooms.filter(m => m.id !== mushroomId));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete mushroom. Please try again.');
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const renderMushroom = ({ item }: { item: SavedMushroom }) => (
    <View style={styles.mushroomCard}>
      <Image source={{ uri: item.imageUri }} style={styles.mushroomImage} />
      <View style={styles.mushroomInfo}>
        <Text style={styles.mushroomName}>{item.name}</Text>
        <Text style={styles.mushroomScientificName}>{item.scientificName}</Text>
        
        {item.location && (
          <View style={styles.locationInfo}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.locationText}>
              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <Icon name="note" size={16} color="#666" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.savedAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.imageUri)}
          >
            <Icon name="delete" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCollection}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mushrooms.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="collections" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Your collection is empty</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.addButtonText}>Add Mushrooms</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mushrooms}
        renderItem={renderMushroom}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  mushroomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mushroomImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mushroomInfo: {
    padding: 16,
  },
  mushroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mushroomScientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notesText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CollectionScreen; 