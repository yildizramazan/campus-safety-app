import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const NOTIFICATION_IMAGES_DIR_NAME = 'local_notification_images';
const STORAGE_KEY_PREFIX = 'notification_image:';

/**
 * Gets or creates the notification images directory
 */
async function getNotificationImagesDirectory(): Promise<Directory> {
    const dir = new Directory(Paths.document, NOTIFICATION_IMAGES_DIR_NAME);
    try {
        const info = await Paths.info(dir.uri);
        if (!info.exists) {
            await dir.create();
        }
    } catch (error) {
        // Directory might already exist, try to create it anyway
        try {
            await dir.create();
        } catch (createError) {
            // Ignore if already exists
        }
    }
    return dir;
}

/**
 * Saves a notification image locally
 * @param notificationId - The notification ID
 * @param pickedUri - The URI from the image picker
 * @returns The stable local file URI
 */
export async function saveNotificationLocalImage(
    notificationId: string,
    pickedUri: string
): Promise<string> {
    try {
        const dir = await getNotificationImagesDirectory();

        // Determine file extension from picked URI
        const extension = pickedUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${notificationId}.${extension}`;

        // Create file instance directly (doesn't need to exist yet)
        const localFile = new File(dir, fileName);

        // Use standard FileSystem API to copy for performance and stability
        // This avoids loading the whole file into JS memory (blob) and fixes the blob.arrayBuffer issue
        if (pickedUri.startsWith('file://')) {
            await copyAsync({
                from: pickedUri,
                to: localFile.uri
            });
        } else {
            // Fallback for non-local URIs (rare in this context but possible)
            const response = await fetch(pickedUri);
            if (!response.ok) {
                throw new Error(`Failed to read source file: ${response.status}`);
            }
            const blob = await response.blob();

            // Write using the specific new File API stream if needed, or just standard write
            const writableStream = localFile.writableStream();
            const writer = writableStream.getWriter();

            // Polyfill-like approach for blob -> Uint8Array if arrayBuffer() is missing
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
                reader.onload = async () => {
                    const result = reader.result;
                    if (result instanceof ArrayBuffer) {
                        await writer.write(new Uint8Array(result));
                        resolve();
                    } else {
                        reject(new Error('Failed to read blob as ArrayBuffer'));
                    }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(blob);
            });
            await writer.close();
        }

        // Store the mapping in AsyncStorage
        const storageKey = `${STORAGE_KEY_PREFIX}${notificationId}`;
        await AsyncStorage.setItem(storageKey, localFile.uri);

        return localFile.uri;
    } catch (error) {
        console.error('Error saving notification image locally:', error);
        // Return empty string instead of throwing - submission can continue
        return '';
    }
}

/**
 * Gets the local image URI for a notification if it exists
 * @param notificationId - The notification ID
 * @returns The local file URI or null if not found
 */
export async function getNotificationLocalImage(
    notificationId: string
): Promise<string | null> {
    try {
        const storageKey = `${STORAGE_KEY_PREFIX}${notificationId}`;
        const localUri = await AsyncStorage.getItem(storageKey);

        if (!localUri) {
            return null;
        }

        // Verify the file still exists
        const info = await Paths.info(localUri);
        if (!info.exists) {
            // Clean up stale mapping
            await AsyncStorage.removeItem(storageKey);
            return null;
        }

        return localUri;
    } catch (error) {
        console.error('Error getting notification local image:', error);
        return null;
    }
}

/**
 * Removes a notification's local image
 * @param notificationId - The notification ID
 */
export async function removeNotificationLocalImage(
    notificationId: string
): Promise<void> {
    try {
        const storageKey = `${STORAGE_KEY_PREFIX}${notificationId}`;
        const localUri = await AsyncStorage.getItem(storageKey);

        if (localUri) {
            // Remove the file
            try {
                const file = new File(localUri);
                const info = await Paths.info(localUri);
                if (info.exists) {
                    await file.delete();
                }
            } catch (fileError) {
                // Ignore file deletion errors
            }

            // Remove the mapping
            await AsyncStorage.removeItem(storageKey);
        }
    } catch (error) {
        console.error('Error removing notification local image:', error);
    }
}

