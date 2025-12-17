import { storage } from '@/config/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function uploadProfileImage(uid: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const objectRef = ref(storage, `profile_images/${uid}.jpg`);
  await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });

  return getDownloadURL(objectRef);
}
