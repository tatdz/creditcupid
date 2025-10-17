// src/config/pinata.ts
export interface PinataConfig {
  jwt: string;
  apiKey: string;
  apiSecret: string;
  gateway: string;
}

export const getPinataConfig = (): PinataConfig => {
  // For Vite environment
  const env = typeof process !== 'undefined' ? process.env : (import.meta as any).env || {};
  
  const config: PinataConfig = {
    jwt: env.VITE_PINATA_JWT || env.PINATA_JWT || '',
    apiKey: env.VITE_PINATA_API_KEY || env.PINATA_API_KEY || '',
    apiSecret: env.VITE_PINATA_SECRET_KEY || env.PINATA_SECRET_KEY || '',
    gateway: 'https://gateway.pinata.cloud/ipfs'
  };

  const hasValidCredentials = !!(config.jwt || (config.apiKey && config.apiSecret));
  
  console.log('🔐 Pinata Config Status:', {
    hasJWT: !!config.jwt,
    hasApiKey: !!config.apiKey,
    hasApiSecret: !!config.apiSecret,
    hasValidCredentials,
    gateway: config.gateway
  });

  if (!hasValidCredentials) {
    console.error('❌ MISSING PINATA CREDENTIALS:');
    console.error('Add to your .env file:');
    console.error('VITE_PINATA_JWT=your_jwt_token_here');
    console.error('OR');
    console.error('VITE_PINATA_API_KEY=your_api_key_here');
    console.error('VITE_PINATA_SECRET_KEY=your_secret_key_here');
  }

  return config;
};