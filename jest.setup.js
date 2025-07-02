// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules = {
    ...RN.NativeModules,
  };
  return RN;
});

// Mock Firebase modules
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
    getDownloadURL: jest.fn(),
  });
});

// Mock react-native-gifted-chat
jest.mock('react-native-gifted-chat', () => ({
  GiftedChat: 'GiftedChat',
  Bubble: 'Bubble',
}));

// Mock other dependencies
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => { };
  return Reanimated;
});

jest.mock('react-native-get-random-values', () => { });
