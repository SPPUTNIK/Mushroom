import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Storage key for image metadata
const IMAGE_METADATA_KEY = 'image_metadata';

interface ImageMetadata {
  id: string;
  uri: string;
  userId: string;
  timestamp: number;
}

// Helper function to get image metadata
const getImageMetadata = async (): Promise<ImageMetadata[]> => {
  try {
    const data = await AsyncStorage.getItem(IMAGE_METADATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return [];
  }
};

// Compress image before saving
const compressImage = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [], // no operations needed
      {
        compress: 0.7, // compress to 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // return original uri if compression fails
  }
};

// Save image to local storage
export const saveImage = async (uri: string, userId: string): Promise<string> => {
  try {
    // Generate a unique ID for the image
    const imageId = Math.random().toString(36).substring(7);
    
    // Create a new file name
    const fileName = `${imageId}.jpg`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Compress the image first
    const compressedUri = await compressImage(uri);
    
    // Copy the compressed image to the app's document directory
    await FileSystem.copyAsync({
      from: compressedUri,
      to: newUri
    });
    
    // Save metadata
    const metadata = await getImageMetadata();
    const newMetadata: ImageMetadata = {
      id: imageId,
      uri: newUri,
      userId,
      timestamp: Date.now()
    };
    
    metadata.push(newMetadata);
    await AsyncStorage.setItem(IMAGE_METADATA_KEY, JSON.stringify(metadata));
    
    return newUri;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

// Delete image from local storage
export const deleteImage = async (uri: string): Promise<void> => {
  try {
    // Delete the file
    await FileSystem.deleteAsync(uri, { idempotent: true });
    
    // Remove metadata
    const metadata = await getImageMetadata();
    const updatedMetadata = metadata.filter(img => img.uri !== uri);
    await AsyncStorage.setItem(IMAGE_METADATA_KEY, JSON.stringify(updatedMetadata));
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Get all images for a user
export const getUserImages = async (userId: string): Promise<string[]> => {
  try {
    const metadata = await getImageMetadata();
    return metadata
      .filter(img => img.userId === userId)
      .map(img => img.uri);
  } catch (error) {
    console.error('Error getting user images:', error);
    return [];
  }
}; 