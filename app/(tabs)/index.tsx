import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const BACKEND_URL = 'https://neo-shapes-results-gilbert.trycloudflare.com';

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

const [description, setDescription] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [descriptionReady, setDescriptionReady] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        return;
      }
    }

    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
    });

    if (photo?.uri) {
  setPhotoUri(photo.uri);
  setPhotoBase64(photo.base64 ?? null);
  setShowCamera(false);
setDescription(null);
setError(null);
setDescriptionReady(false);

  if (photo.base64) {
    Speech.speak('Photo captured successfully. Describing...');
    await describeImage(photo.base64);
  }
}
  };

  const describeImage = async (imageBase64: string) => {
    

    setLoading(true);
    setDescription(null);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/describe`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: imageBase64,
  }),
});

const responseText = await response.text();

if (!response.ok) {
  throw new Error(responseText || 'Something went wrong.');
}

let data;

try {
  data = JSON.parse(responseText);
} catch (parseError) {
  console.error('Invalid JSON from backend:', responseText);
  throw new Error('The server returned an invalid response.');
}

if (!data.description) {
  throw new Error('No description was returned by the server.');
}

    Speech.stop();
setDescription(data.description);
setDescriptionReady(true);
Speech.speak(data.description);
} catch (err) {
  console.error('Description error:', err);

  const errorMessage =
    'Could not describe the image. Please check that the backend is running.';

  setError(errorMessage);
  Speech.stop();
  Speech.speak(errorMessage);
}
    finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        <View style={styles.cameraControls}>
          <Pressable
            style={styles.captureButton}
            onPress={takePhoto}
          >
            <Text style={styles.captureText}>📸</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
  <Pressable
    style={styles.container}
    onPress={descriptionReady ? openCamera : undefined}
    disabled={!descriptionReady}
  >
  <Pressable
  style={styles.cameraActivationArea}
  onPress={descriptionReady ? undefined : openCamera}
  disabled={loading || descriptionReady}
>
    <Text style={styles.emoji}>👁️</Text>

    <Text style={styles.title}>VisionVoice</Text>

    <Text style={styles.subtitle}>
      See the world through sound
    </Text>

    {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
        />
      ) : (
        <View style={styles.cameraCircle}>
          <Text style={styles.cameraEmoji}>📷</Text>
        </View>
      )}

      <View style={styles.button}>
  <Text style={styles.buttonText}>
    {photoUri ? 'Take Another Photo' : 'Take a Photo'}
  </Text>
</View>
</Pressable>

      {photoUri && (
  <>
    <Text style={styles.successText}>
      Photo captured successfully! ✅
    </Text>

    {loading && (
      <Text style={styles.successText}>
        🤖 Describing...
      </Text>
    )}
  </>
)}

      {description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionTitle}>
            AI Description
          </Text>

          <Text style={styles.aiDescription}>
            {description}
          </Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <Text style={styles.description}>
        AI-powered image descriptions{'\n'}
        designed for accessibility
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F5F9FC',
  },
  cameraActivationArea: {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 20,
  borderRadius: 20,
},
  emoji: {
    fontSize: 45,
    marginBottom: 10,
  },

  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#555555',
    marginBottom: 35,
  },

  cameraCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },

  cameraEmoji: {
    fontSize: 48,
  },

  preview: {
    width: 220,
    height: 220,
    borderRadius: 20,
    marginBottom: 30,
  },

  button: {
    backgroundColor: '#1D3D47',
    paddingVertical: 18,
    paddingHorizontal: 45,
    borderRadius: 15,
    marginBottom: 15,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  aiButton: {
    backgroundColor: '#3A7D8C',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 15,
    marginBottom: 15,
  },

  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  successText: {
    fontSize: 16,
    color: '#1D3D47',
    marginBottom: 15,
  },

  descriptionBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginTop: 10,
    marginBottom: 20,
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 8,
  },

  aiDescription: {
    fontSize: 17,
    lineHeight: 25,
    color: '#333333',
  },

  errorText: {
    color: '#B00020',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 10,
  },

  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    lineHeight: 24,
    marginTop: 10,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
  },

  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#1D3D47',
  },

  captureText: {
    fontSize: 32,
  },
});