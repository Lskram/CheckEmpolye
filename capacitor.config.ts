import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yokohama.attendance',
  appName: 'Attendance Check-In',
  webDir: 'out',
  server: {
    url: 'https://check-empolye.vercel.app/employee',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    Geolocation: {},
    Device: {},
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
