// src/config/pinata.ts
export interface PinataConfig {
  jwt: string;
  apiKey: string;
  apiSecret: string;
  gateway: string;
}

export const getPinataConfig = (): PinataConfig => {
  // Direct Vite environment variable access
  const config: PinataConfig = {
    jwt: import.meta.env.VITE_PINATA_JWT || '',
    apiKey: import.meta.env.VITE_PINATA_API_KEY || '',
    apiSecret: import.meta.env.VITE_PINATA_API_SECRET || '',
    gateway: 'https://gateway.pinata.cloud/ipfs'
  };

  // Debug logging
  console.log('🔍 Direct Vite Env Check:', {
    VITE_PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY ? 'SET' : 'MISSING',
    VITE_PINATA_API_SECRET: import.meta.env.VITE_PINATA_API_SECRET ? 'SET' : 'MISSING',
    VITE_PINATA_JWT: import.meta.env.VITE_PINATA_JWT ? 'SET' : 'MISSING',
    allViteKeys: Object.keys(import.meta.env).filter(key => key.includes('PINATA'))
  });

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
    console.error('Add to your .env file in the root directory:');
    console.error('VITE_PINATA_JWT=your_jwt_token_here');
    console.error('OR');
    console.error('VITE_PINATA_API_KEY=your_api_key_here');
    console.error('VITE_PINATA_API_SECRET=your_secret_key_here');
    
    console.error('🔍 Current environment status:');
    console.error('   VITE_PINATA_API_KEY:', config.apiKey ? 'SET' : 'NOT SET');
    console.error('   VITE_PINATA_API_SECRET:', config.apiSecret ? 'SET' : 'NOT SET');
    console.error('   VITE_PINATA_JWT:', config.jwt ? 'SET' : 'NOT SET');
  } else {
    console.log('✅ Pinata credentials loaded successfully!');
  }

  return config;
};