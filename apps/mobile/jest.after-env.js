// Keeps a session persisted by one test from being restored by the next.
afterEach(() => {
  require('expo-secure-store').__reset();
});
