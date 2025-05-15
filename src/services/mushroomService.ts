import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_URL = 'https://api.mushroom-identifier.com/v1'; // Replace with your actual API endpoint

export interface MushroomIdentification {
  id: string;
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  edibility: 'edible' | 'poisonous' | 'unknown';
  characteristics: {
    cap: string;
    gills: string;
    stem: string;
    habitat: string;
  };
  similarSpecies: Array<{
    name: string;
    scientificName: string;
    edibility: 'edible' | 'poisonous' | 'unknown';
  }>;
}

export const identifyMushroom = async (imageUri: string): Promise<MushroomIdentification> => {
  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare the request
    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      type: 'image/jpeg',
      name: 'mushroom.jpg',
    });

    // Make the API request
    const response = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to identify mushroom');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error identifying mushroom:', error);
    throw error;
  }
};

export const getMushroomDetails = async (mushroomId: string): Promise<MushroomIdentification> => {
  try {
    const response = await fetch(`${API_URL}/mushrooms/${mushroomId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch mushroom details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching mushroom details:', error);
    throw error;
  }
}; 