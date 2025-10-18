// config/chains.ts
export interface ChainConfig {
  chainId: string;
  name: string;
  blockscoutUrl: string;
  morphoAddress: string;
  aaveAddresses: string[];
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  '1': {
    chainId: '1',
    name: 'Ethereum Mainnet',
    blockscoutUrl: 'https://eth.blockscout.com',
    morphoAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    aaveAddresses: [
      '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      '0x4e033931ad43597d96D6bcc25c280717730B58B1',
      '0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8',
      '0x0AA97c284e98396202b6A04024F5E2c65026F3c0'
    ]
  },
  '137': {
    chainId: '137',
    name: 'Polygon Mainnet',
    blockscoutUrl: 'https://polygon.blockscout.com',
    morphoAddress: '0x1bF0c2541F820E775182832f06c0B7Fc27A25f67',
    aaveAddresses: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD']
  },
  '42161': {
    chainId: '42161',
    name: 'Arbitrum One',
    blockscoutUrl: 'https://arbitrum.blockscout.com',
    morphoAddress: '0x6c247b1F6182318877311737BaC0844bAa518F5e',
    aaveAddresses: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD']
  },
  '10': {
    chainId: '10',
    name: 'Optimism',
    blockscoutUrl: 'https://optimism.blockscout.com',
    morphoAddress: '0xd85cE6BD68487E0AaFb0858FDE1Cd18c76840564',
    aaveAddresses: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD']
  },
  '8453': {
    chainId: '8453',
    name: 'Base',
    blockscoutUrl: 'https://base.blockscout.com',
    morphoAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    aaveAddresses: ['0xA238Dd80C259a72e81d7e4664a9801593F98d1c5']
  },
  '56': {
    chainId: '56',
    name: 'BNB Chain',
    blockscoutUrl: 'https://bsc.blockscout.com',
    morphoAddress: '0x01b0Bd309AA75547f7a37Ad7B1219A898E67a83a',
    aaveAddresses: ['0x6807dc923806fE8Fd134338EABCA509979a7e0cB']
  },
  '43114': {
    chainId: '43114',
    name: 'Avalanche',
    blockscoutUrl: 'https://avalanche.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD']
  },
  '100': {
    chainId: '100',
    name: 'Gnosis',
    blockscoutUrl: 'https://gnosis.blockscout.com',
    morphoAddress: '0xB74D4dd451E250bC325AFF0556D717e4E2351c66',
    aaveAddresses: ['0xb50201558B00496A145fE76f7424749556E326D8']
  },
  '534352': {
    chainId: '534352',
    name: 'Scroll',
    blockscoutUrl: 'https://scroll.blockscout.com',
    morphoAddress: '0x2d012EdbAdc37eDc2BC62791B666f9193FDF5a55',
    aaveAddresses: ['0x11fCfe756c05AD438e312a7fd934381537D3cFfe']
  },
  '324': {
    chainId: '324',
    name: 'zkSync Era',
    blockscoutUrl: 'https://zksync.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0x78e30497a3c7527d953c6B1E3541b021A98Ac43c']
  },
  '42220': {
    chainId: '42220',
    name: 'Celo',
    blockscoutUrl: 'https://celo.blockscout.com',
    morphoAddress: '0xd24ECdD8C1e0E57a4E26B1a7bbeAa3e95466A569',
    aaveAddresses: ['0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402']
  },
  '59144': {
    chainId: '59144',
    name: 'Linea',
    blockscoutUrl: 'https://linea.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0xc47b8C00b0f69a36fa203Ffeac0334874574a8Ac']
  },
  '1101': {
    chainId: '1101',
    name: 'Polygon zkEVM',
    blockscoutUrl: 'https://zkevm.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0x925a2A7214Ed92428B5b1B090F80b25700095e12']
  },
  '1088': {
    chainId: '1088',
    name: 'Metis',
    blockscoutUrl: 'https://metis.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57']
  },
  '34443': {
    chainId: '34443',
    name: 'Mode',
    blockscoutUrl: 'https://mode.blockscout.com',
    morphoAddress: '0xd85cE6BD68487E0AaFb0858FDE1Cd18c76840564',
    aaveAddresses: ['0x0000000000000000000000000000000000000000']
  },
  '252': {
    chainId: '252',
    name: 'Fraxtal',
    blockscoutUrl: 'https://frax.blockscout.com',
    morphoAddress: '0xa6030627d724bA78a59aCf43Be7550b4C5a0653b',
    aaveAddresses: ['0x0000000000000000000000000000000000000000']
  },
  '11155111': {
    chainId: '11155111',
    name: 'Sepolia',
    blockscoutUrl: 'https://sepolia.blockscout.com',
    morphoAddress: '0x0000000000000000000000000000000000000000',
    aaveAddresses: ['0x0000000000000000000000000000000000000000']
  }
};

export const getChainConfig = (chainId: string | number): ChainConfig => {
  const id = typeof chainId === 'number' ? chainId.toString() : chainId;
  return CHAIN_CONFIGS[id] || CHAIN_CONFIGS['1']; // Default to Ethereum
};