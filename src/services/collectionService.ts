import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
export interface MushroomData {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  userId: string;
  isFavorite: boolean;
}

// Storage keys
const COLLECTION_KEY = 'mushroom_collection';
const FAVORITES_KEY = 'mushroom_favorites';

// Helper functions
const getCollection = async (): Promise<MushroomData[]> => {
  try {
    const data = await AsyncStorage.getItem(COLLECTION_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting collection:', error);
    return [];
  }
};

const getFavorites = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Main functions
export const saveMushroom = async (data: Omit<MushroomData, 'id' | 'timestamp' | 'isFavorite'>): Promise<MushroomData> => {
  try {
    const collection = await getCollection();
    const newMushroom: MushroomData = {
      ...data,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      isFavorite: false
    };
    
    collection.push(newMushroom);
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
    return newMushroom;
  } catch (error) {
    console.error('Error saving mushroom:', error);
    throw error;
  }
};

export const getMushrooms = async (userId: string): Promise<MushroomData[]> => {
  try {
    const collection = await getCollection();
    const favorites = await getFavorites();
    
    return collection
      .filter(mushroom => mushroom.userId === userId)
      .map(mushroom => ({
        ...mushroom,
        isFavorite: favorites.includes(mushroom.id)
      }));
  } catch (error) {
    console.error('Error getting mushrooms:', error);
    return [];
  }
};

export const deleteMushroom = async (id: string): Promise<void> => {
  try {
    const collection = await getCollection();
    const updatedCollection = collection.filter(mushroom => mushroom.id !== id);
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(updatedCollection));
    
    // Also remove from favorites if present
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(favId => favId !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error deleting mushroom:', error);
    throw error;
  }
};

export const toggleFavorite = async (id: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    const isFavorite = favorites.includes(id);
    
    const updatedFavorites = isFavorite
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}; 