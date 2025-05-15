import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Share,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import SuperCluster from 'react-native-maps-super-cluster';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { getCollection, SavedMushroom, toggleFavorite } from '../services/collectionService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

type MapScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
  route: RouteProp<RootStackParamList, 'Map'>;
};

type FilterOptions = {
  edible: boolean;
  poisonous: boolean;
  unknown: boolean;
  favorites: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery: string;
};

type SortOption = 'date' | 'name' | 'scientificName';

const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [mushrooms, setMushrooms] = useState<SavedMushroom[]>([]);
  const [filteredMushrooms, setFilteredMushrooms] = useState<SavedMushroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortAscending, setSortAscending] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    edible: true,
    poisonous: true,
    unknown: true,
    favorites: false,
    dateRange: {
      start: null,
      end: null,
    },
    searchQuery: '',
  });
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    loadCollection();
  }, []);

  useEffect(() => {
    filterMushrooms();
  }, [mushrooms, filters, sortBy, sortAscending]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const collection = await getCollection();
      const mushroomsWithLocation = collection.filter(m => m.location);
      setMushrooms(mushroomsWithLocation);

      if (mushroomsWithLocation.length > 0) {
        const firstMushroom = mushroomsWithLocation[0];
        setRegion({
          latitude: firstMushroom.location!.latitude,
          longitude: firstMushroom.location!.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (err) {
      setError('Failed to load collection. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterMushrooms = () => {
    const filtered = mushrooms.filter(mushroom => {
      const edibility = mushroom.edibility.toLowerCase();
      const matchesEdibility =
        (edibility === 'edible' && filters.edible) ||
        (edibility === 'poisonous' && filters.poisonous) ||
        (edibility !== 'edible' && edibility !== 'poisonous' && filters.unknown);

      const matchesSearch = filters.searchQuery === '' ||
        mushroom.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        mushroom.scientificName.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesDate = (!filters.dateRange.start || new Date(mushroom.timestamp) >= filters.dateRange.start) &&
        (!filters.dateRange.end || new Date(mushroom.timestamp) <= filters.dateRange.end);

      const matchesFavorites = !filters.favorites || mushroom.isFavorite;

      return matchesEdibility && matchesSearch && matchesDate && matchesFavorites;
    });

    // Sort the filtered mushrooms
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'scientificName':
          comparison = a.scientificName.localeCompare(b.scientificName);
          break;
      }
      return sortAscending ? comparison : -comparison;
    });

    setFilteredMushrooms(sorted);
  };

  const resetFilters = () => {
    setFilters({
      edible: true,
      poisonous: true,
      unknown: true,
      favorites: false,
      dateRange: {
        start: null,
        end: null,
      },
      searchQuery: '',
    });
    setSortBy('date');
    setSortAscending(true);
  };

  const showAllMushrooms = () => {
    if (filteredMushrooms.length === 0) return;

    const latitudes = filteredMushrooms.map(m => m.location!.latitude);
    const longitudes = filteredMushrooms.map(m => m.location!.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const padding = 0.1; // 10% padding
    const latDelta = (maxLat - minLat) * (1 + padding);
    const lngDelta = (maxLng - minLng) * (1 + padding);

    mapRef.current?.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    }, 1000);
  };

  const toggleFilter = (filter: keyof Omit<FilterOptions, 'dateRange' | 'searchQuery'>) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [showDatePicker === 'start' ? 'start' : 'end']: selectedDate,
        },
      }));
    }
  };

  const handleSearch = (text: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: text,
    }));
  };

  const handleClusterPress = (cluster: any) => {
    const { geometry } = cluster;
    const { coordinates } = geometry;
    const [longitude, latitude] = coordinates;

    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    }, 500);
  };

  const handleShareLocation = async (mushroom: SavedMushroom) => {
    try {
      const { latitude, longitude } = mushroom.location!;
      const message = `Check out this ${mushroom.name} (${mushroom.scientificName}) I found!\n\nLocation: https://www.google.com/maps?q=${latitude},${longitude}`;
      
      await Share.share({
        message,
        title: `Mushroom Location: ${mushroom.name}`,
      });
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  };

  const handleGetDirections = async (mushroom: SavedMushroom) => {
    try {
      const { latitude, longitude } = mushroom.location!;
      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}`,
        android: `google.navigation:q=${latitude},${longitude}`,
      });

      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback to Google Maps web URL
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Failed to open directions. Please try again.');
    }
  };

  const handleToggleFavorite = async (mushroom: SavedMushroom) => {
    try {
      await toggleFavorite(mushroom.id, mushroom.isFavorite);
      // Refresh the collection to update the UI
      loadCollection();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  const handleMarkerPress = (mushroom: SavedMushroom) => {
    Alert.alert(
      mushroom.name,
      `Scientific Name: ${mushroom.scientificName}\nEdibility: ${mushroom.edibility}\n${
        mushroom.notes ? `\nNotes: ${mushroom.notes}` : ''
      }`,
      [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('Identification', { imageUri: mushroom.imageUri }),
        },
        {
          text: 'Get Directions',
          onPress: () => handleGetDirections(mushroom),
        },
        {
          text: 'Share Location',
          onPress: () => handleShareLocation(mushroom),
        },
        {
          text: mushroom.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
          onPress: () => handleToggleFavorite(mushroom),
        },
        {
          text: 'Close',
          style: 'cancel',
        },
      ]
    );
  };

  const renderCluster = (cluster: any, onPress: () => void) => {
    const { point_count: pointCount } = cluster.properties;
    return (
      <Marker
        coordinate={{
          latitude: cluster.geometry.coordinates[1],
          longitude: cluster.geometry.coordinates[0],
        }}
        onPress={() => handleClusterPress(cluster)}
      >
        <View style={styles.clusterMarker}>
          <Text style={styles.clusterText}>{pointCount}</Text>
        </View>
      </Marker>
    );
  };

  const renderMarker = (mushroom: SavedMushroom) => {
    const getMarkerColor = (edibility: string) => {
      switch (edibility.toLowerCase()) {
        case 'edible':
          return '#4CAF50';
        case 'poisonous':
          return '#F44336';
        default:
          return '#FFA000';
      }
    };

    return (
      <Marker
        key={mushroom.id}
        coordinate={{
          latitude: mushroom.location!.latitude,
          longitude: mushroom.location!.longitude,
        }}
        onPress={() => handleMarkerPress(mushroom)}
      >
        <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(mushroom.edibility) }]}>
          <Icon name="eco" size={24} color="#fff" />
          {mushroom.isFavorite && (
            <View style={styles.favoriteBadge}>
              <Icon name="star" size={12} color="#FFD700" />
            </View>
          )}
        </View>
      </Marker>
    );
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Mushrooms</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filterList}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search mushrooms..."
                value={filters.searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View style={styles.sortContainer}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
                  onPress={() => setSortBy('date')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
                  onPress={() => setSortBy('name')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                    Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'scientificName' && styles.sortButtonActive]}
                  onPress={() => setSortBy('scientificName')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'scientificName' && styles.sortButtonTextActive]}>
                    Scientific
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.sortDirectionButton}
                onPress={() => setSortAscending(!sortAscending)}
              >
                <Icon
                  name={sortAscending ? 'arrow-upward' : 'arrow-downward'}
                  size={24}
                  color="#4CAF50"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dateFilterContainer}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.dateButtons}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Text style={styles.dateButtonText}>
                    {filters.dateRange.start ? filters.dateRange.start.toLocaleDateString() : 'Start Date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('end')}
                >
                  <Text style={styles.dateButtonText}>
                    {filters.dateRange.end ? filters.dateRange.end.toLocaleDateString() : 'End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => toggleFilter('favorites')}
            >
              <View style={[styles.filterMarker, { backgroundColor: '#FFD700' }]}>
                <Icon name="star" size={20} color="#fff" />
              </View>
              <Text style={styles.filterText}>Favorites Only</Text>
              <Icon
                name={filters.favorites ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#FFD700"
              />
            </TouchableOpacity>

            <Text style={styles.filterSectionTitle}>Edibility</Text>
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => toggleFilter('edible')}
            >
              <View style={[styles.filterMarker, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.filterText}>Edible</Text>
              <Icon
                name={filters.edible ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#4CAF50"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => toggleFilter('poisonous')}
            >
              <View style={[styles.filterMarker, { backgroundColor: '#F44336' }]} />
              <Text style={styles.filterText}>Poisonous</Text>
              <Icon
                name={filters.poisonous ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#F44336"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => toggleFilter('unknown')}
            >
              <View style={[styles.filterMarker, { backgroundColor: '#FFA000' }]} />
              <Text style={styles.filterText}>Unknown</Text>
              <Icon
                name={filters.unknown ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#FFA000"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Icon name="refresh" size={24} color="#fff" />
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLegend = () => (
    <Modal
      visible={showLegend}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLegend(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Map Legend</Text>
            <TouchableOpacity onPress={() => setShowLegend(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.legendContent}>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#4CAF50' }]}>
                <Icon name="eco" size={20} color="#fff" />
              </View>
              <Text style={styles.legendText}>Edible Mushroom</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#F44336' }]}>
                <Icon name="eco" size={20} color="#fff" />
              </View>
              <Text style={styles.legendText}>Poisonous Mushroom</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#FFA000' }]}>
                <Icon name="eco" size={20} color="#fff" />
              </View>
              <Text style={styles.legendText}>Unknown Edibility</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.clusterMarker}>
                <Text style={styles.clusterText}>3</Text>
              </View>
              <Text style={styles.legendText}>Cluster of 3 Mushrooms</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
        <Icon name="map" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No mushrooms with location data</Text>
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
      <SuperCluster
        data={filteredMushrooms.map(mushroom => ({
          type: 'Feature',
          properties: { mushroom },
          geometry: {
            type: 'Point',
            coordinates: [mushroom.location!.longitude, mushroom.location!.latitude],
          },
        }))}
        radius={40}
        extent={512}
        nodeSize={64}
        renderCluster={renderCluster}
        renderMarker={({ properties }) => renderMarker(properties.mushroom)}
      >
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        />
      </SuperCluster>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter-list" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowLegend(true)}
        >
          <Icon name="info" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={showAllMushrooms}
        >
          <Icon name="zoom-out-map" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderFilters()}
      {renderLegend()}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? filters.dateRange.start || new Date() : filters.dateRange.end || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterList: {
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    color: '#333',
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortDirectionButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  dateFilterContainer: {
    marginBottom: 16,
  },
  dateFilterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#333',
    fontSize: 14,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  filterText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legendContent: {
    padding: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendText: {
    fontSize: 16,
    color: '#333',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});

export default MapScreen; 