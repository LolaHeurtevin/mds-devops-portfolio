'use client';

import { useEffect } from 'react';
import { initializeFaro } from '@grafana/faro-web-sdk';

let faroInitialized = false;

export function FaroProvider() {
  useEffect(() => {
    // Prevent multiple initializations
    if (faroInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GRAFANA_FARO_API_KEY;
      
      // Only initialize if API key is configured
      if (!apiKey) {
        console.warn('Faro SDK not configured (missing NEXT_PUBLIC_GRAFANA_FARO_API_KEY)');
        return;
      }

      initializeFaro({
        url: process.env.NEXT_PUBLIC_GRAFANA_FARO_URL || 'https://telemetry-intake.grafana.net/v1/traces',
        apiKey,
        app: {
          name: 'portfolio',
          version: '0.1.0',
          environment: process.env.NEXT_PUBLIC_ENV || 'development',
        },
      });

      faroInitialized = true;
      console.log('Faro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Faro:', error);
    }
  }, []);

  return null;
}
