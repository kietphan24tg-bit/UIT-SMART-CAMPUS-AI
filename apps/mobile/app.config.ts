import appJson from './app.json';

const config = appJson.expo;

export default () => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000/api/v1',
  },
});
