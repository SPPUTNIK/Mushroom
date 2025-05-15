import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { identifyMushroom, MushroomIdentification } from '../services/mushroomService';
import { saveToCollection } from '../services/collectionService';
import { getCurrentLocation, getLocationName, LocationData } from '../services/locationService';
import Icon from 'react-native-vector-icons/MaterialIcons';

type IdentificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Identification'>;
  route: RouteProp<RootStackParamList, 'Identification'>;
};

const IdentificationScreen: React.FC<IdentificationScreenProps> = ({ navigation, route }) => {
  const { imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MushroomIdentification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    identifyMushroomImage();
  }, [imageUri]);

  const identifyMushroomImage = async () => {
    try {
      setLoading(true);
      setError(null);
      const identification = await identifyMushroom(imageUri);
      setResult(identification);
    } catch (err) {
      setError('Failed to identify mushroom. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      const name = await getLocationName(currentLocation.latitude, currentLocation.longitude);
      setLocationName(name);
    } catch (err) {
      Alert.alert('Error', 'Failed to get location. Please check your location permissions.');
      console.error(err);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSaveToCollection = async () => {
    if (!result) return;

    try {
      setSaving(true);
      await saveToCollection(
        result,
        imageUri,
        location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
        notes
      );
      Alert.alert('Success', 'Saved to your collection!');
      navigation.navigate('Collection');
    } catch (err) {
      Alert.alert('Error', 'Failed to save to collection. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getEdibilityColor = (edibility: string) => {
    switch (edibility) {
      case 'edible':
        return '#4CAF50';
      case 'poisonous':
        return '#F44336';
      default:
        return '#FFA000';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Identifying mushroom...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={identifyMushroomImage}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{result.name}</Text>
          <Text style={styles.scientificName}>{result.scientificName}</Text>
          <View style={[styles.edibilityBadge, { backgroundColor: getEdibilityColor(result.edibility) }]}>
            <Text style={styles.edibilityText}>{result.edibility.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{result.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Characteristics</Text>
          <View style={styles.characteristics}>
            <View style={styles.characteristic}>
              <Icon name="circle" size={16} color="#4CAF50" />
              <Text style={styles.characteristicText}>Cap: {result.characteristics.cap}</Text>
            </View>
            <View style={styles.characteristic}>
              <Icon name="circle" size={16} color="#4CAF50" />
              <Text style={styles.characteristicText}>Gills: {result.characteristics.gills}</Text>
            </View>
            <View style={styles.characteristic}>
              <Icon name="circle" size={16} color="#4CAF50" />
              <Text style={styles.characteristicText}>Stem: {result.characteristics.stem}</Text>
            </View>
            <View style={styles.characteristic}>
              <Icon name="circle" size={16} color="#4CAF50" />
              <Text style={styles.characteristicText}>Habitat: {result.characteristics.habitat}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Similar Species</Text>
          {result.similarSpecies.map((species, index) => (
            <View key={index} style={styles.similarSpecies}>
              <Text style={styles.similarSpeciesName}>{species.name}</Text>
              <Text style={styles.similarSpeciesScientific}>{species.scientificName}</Text>
              <View style={[styles.similarSpeciesEdibility, { backgroundColor: getEdibilityColor(species.edibility) }]}>
                <Text style={styles.similarSpeciesEdibilityText}>{species.edibility}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleGetLocation}
            disabled={gettingLocation}
          >
            <Icon name="location-on" size={24} color="#4CAF50" />
            <Text style={styles.locationButtonText}>
              {gettingLocation ? 'Getting Location...' : 'Add Location'}
            </Text>
          </TouchableOpacity>

          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{locationName}</Text>
              <Text style={styles.locationCoordinates}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.notesButton}
            onPress={() => setShowNotes(!showNotes)}
          >
            <Icon name={showNotes ? "expand-less" : "expand-more"} size={24} color="#4CAF50" />
            <Text style={styles.notesButtonText}>
              {showNotes ? 'Hide Notes' : 'Add Notes'}
            </Text>
          </TouchableOpacity>

          {showNotes && (
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this mushroom..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveToCollection}
          disabled={saving}
        >
          <Icon name="bookmark" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save to Collection'}
          </Text>
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This identification is based on AI analysis and should not be used as the sole basis for determining edibility. Always consult with experts before consuming any wild mushrooms.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  scientificName: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  edibilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  edibilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  characteristics: {
    gap: 8,
  },
  characteristic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  characteristicText: {
    fontSize: 16,
    color: '#333',
  },
  similarSpecies: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarSpeciesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  similarSpeciesScientific: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  similarSpeciesEdibility: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  similarSpeciesEdibilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  disclaimerText: {
    color: '#E65100',
    fontSize: 14,
    lineHeight: 20,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  notesButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationCoordinates: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default IdentificationScreen; 