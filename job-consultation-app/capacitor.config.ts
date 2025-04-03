import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobconsultation.app',
  appName: 'Job Consultation',
  webDir: 'dist/job-consultation-app/browser',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['localhost', '10.0.2.2', '192.168.*.*']
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
