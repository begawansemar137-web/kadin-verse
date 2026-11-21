// Official mock shipped by react-native-safe-area-context for Jest.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// In-memory stand-in for the native keystore. Reset after every test in jest.after-env.js.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});
