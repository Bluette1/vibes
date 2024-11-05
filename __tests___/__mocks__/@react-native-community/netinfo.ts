// __mocks__/@react-native-community/netinfo.ts
export default {
  addEventListener: jest.fn(),
  fetch: jest.fn().mockImplementation(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  useNetInfo: jest.fn().mockImplementation(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
};
