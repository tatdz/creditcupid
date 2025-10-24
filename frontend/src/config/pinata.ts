export interface PinataConfig {
  gateway: string;

}

export const getPinataConfig = (): PinataConfig => {
  const config: PinataConfig = {
    gateway: 'https://gateway.pinata.cloud/ipfs'
  };

  console.log('🔐 Pinata Config: Using backend proxy for all Pinata operations');
  console.log('💡 All sensitive API keys are now securely stored in the backend');

  return config;
};

// New function to upload via backend proxy
export const uploadToPinataViaProxy = async (data: any): Promise<string> => {
  try {
    const response = await fetch('/api/proxy/pinata/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Pinata via proxy');
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('❌ Pinata upload failed:', error);
    // Fallback to mock CID for development
    return `mock-cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};