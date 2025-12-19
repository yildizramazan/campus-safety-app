import { storage } from '@/config/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const getBlobFromUri = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to fetch local file.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split('?')[0].split('#')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
};

const getContentType = (extension: string, blobType?: string) => {
  if (blobType) return blobType;
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
};

export async function uploadProfileImage(uid: string, localUri: string): Promise<string> {
  try {
    console.log('Starting upload for:', uid);
    console.log('Configured Storage Bucket:', storage.app.options.storageBucket);
    console.log('Local URI:', localUri);

    const blob = await getBlobFromUri(localUri);
    const extension = getFileExtension(localUri);
    const contentType = getContentType(extension, blob.type);
    console.log('Blob created:', blob.size, blob.type || contentType);

    const objectRef = ref(storage, `profile_images/${uid}_${Date.now()}.${extension}`);
    console.log('Uploading to:', objectRef.fullPath);

    const result = await uploadBytes(objectRef, blob, { contentType });
    console.log('Upload result:', result);

    const url = await getDownloadURL(objectRef);
    console.log('Download URL:', url);
    if (typeof (blob as any).close === 'function') {
      (blob as any).close();
    }
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

export async function uploadNotificationImage(uid: string, localUri: string): Promise<string> {
  try {
    console.log('Starting notification upload for:', uid);
    console.log('Configured Storage Bucket:', storage.app.options.storageBucket);
    console.log('Local URI:', localUri);

    const blob = await getBlobFromUri(localUri);
    const extension = getFileExtension(localUri);
    const contentType = getContentType(extension, blob.type);
    console.log('Blob created:', blob.size, blob.type || contentType);

    const objectRef = ref(storage, `notification_images/${uid}_${Date.now()}.${extension}`);
    console.log('Uploading to:', objectRef.fullPath);

    const result = await uploadBytes(objectRef, blob, { contentType });
    console.log('Upload result:', result);

    const url = await getDownloadURL(objectRef);
    console.log('Download URL:', url);
    if (typeof (blob as any).close === 'function') {
      (blob as any).close();
    }
    return url;
  } catch (error: any) {
    console.error('Error in uploadNotificationImage:', error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.message) console.error('Error Message:', error.message);
    if (error.serverResponse) console.error('Server Response:', error.serverResponse);
    throw error;
  }
}
