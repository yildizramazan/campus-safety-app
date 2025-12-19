import { storage } from '@/config/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function uploadProfileImage(uid: string, localUri: string): Promise<string> {
  try {
    console.log('Starting upload for:', uid);
    console.log('Configured Storage Bucket:', storage.app.options.storageBucket);
    console.log('Local URI:', localUri);

    const response = await fetch(localUri);
    const blob = await response.blob();
    console.log('Blob created:', blob.size, blob.type);

    const objectRef = ref(storage, `profile_images/${uid}_${Date.now()}.jpg`);
    console.log('Uploading to:', objectRef.fullPath);

    const result = await uploadBytes(objectRef, blob);
    console.log('Upload result:', result);

    const url = await getDownloadURL(objectRef);
    console.log('Download URL:', url);
    return url;
  } catch (error: any) {
    console.error('Error in uploadProfileImage:', error);
    // Log full error object properties
    if (error.code) console.error('Error Code:', error.code);
    if (error.message) console.error('Error Message:', error.message);
    if (error.serverResponse) console.error('Server Response:', error.serverResponse);
    throw error;
  }
}
