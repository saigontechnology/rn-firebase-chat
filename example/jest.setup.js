// Mock react-native modules for example project
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    Image: 'Image',
    FlatList: 'FlatList',
    ScrollView: 'ScrollView',
    TextInput: 'TextInput',
    Modal: 'Modal',
    Alert: {
      alert: jest.fn(),
    },
    BackHandler: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(),
  };
});

// Mock Firebase modules
jest.mock('@react-native-firebase/app', () => {
  return () => ({
    // Mock Firebase app methods
  });
});

jest.mock('@react-native-firebase/firestore', () => {
  return () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    onSnapshot: jest.fn(),
  });
});

jest.mock('@react-native-firebase/storage', () => {
  return () => ({
    ref: jest.fn(),
    putFile: jest.fn(),
    getDownloadURL: jest.fn(),
  });
});

// Mock other native modules
jest.mock('react-native-aes-crypto', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  pbkdf2: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-video', () => 'Video');

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('react-native-get-random-values', () => { });

// Mock global crypto for tests
global.crypto = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};
