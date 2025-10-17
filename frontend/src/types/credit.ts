export interface TokenBalance {
  symbol: string;
  balance: string;
  valueUSD: number;
  contractAddress: string;
}

export interface WalletActivity {
  totalTransactions: number;
  activeDays: number;
  transactions?: any[];
  interactions?: any[];
  lastActivity?: number;
}

export interface WalletData {
  totalValueUSD: number;
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  activity: WalletActivity;
}

export interface CollateralAsset {
  symbol: string;
  amount: string;
  valueUSD: number;
  collateralFactor: number;
}

export interface CollateralAnalysis {
  collateralValueUSD: number;
  collateralRatio: number;
  liquidationThreshold: number;
  collateralBoost: number;
  assets: CollateralAsset[];
  currentCollateralValue: string;
  enhancedCollateralValue: string;
}

export interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
}

export interface OracleData {
  ethPriceUSD: number;
  gasPrices: GasPrices;
}

export interface ProtocolInteraction {
  protocol: string;
  type: string;
  asset: string;
  amount: string;
  timestamp: number;
  txHash: string;
  chainId: number;
}

export interface TransactionAnalysis {
  totalTransactions: number;
  activeMonths: number;
  transactionVolume: number;
  protocolInteractions: number;
  avgTxFrequency: string;
  riskScore: number;
}

export interface CreditBenefit {
  type: string;
  description: string;
  value: string;
  status: 'active' | 'pending' | 'inactive';
  eligibility: boolean;
}

export interface ZKProofData {
  incomeProof: string;
  balanceProof: string;
  transactionProof: string;
  identityProof: string;
}

export interface ZKValidationUrls {
  incomeProof: string;
  balanceProof: string;
  transactionProof: string;
  identityProof: string;
}

export interface ZKProofs {
  proofs: ZKProofData;
  validationUrls: ZKValidationUrls;
  incomeVerified: boolean;
  accountBalanceVerified: boolean;
  transactionHistoryVerified: boolean;
  identityVerified: boolean;
}

// Enhanced interface for Pinata-stored proofs with public gateway support
export interface StoredZKProofs extends ZKProofs {
  ipfsData: {
    incomeProofCID?: string;
    balanceProofCID?: string;
    transactionProofCID?: string;
    identityProofCID?: string;
    fullProofsCID?: string;
    verificationReportCID?: string;
  };
  pinataURLs: {
    incomeProof?: string;
    balanceProof?: string;
    transactionProof?: string;
    identityProof?: string;
    fullProofs?: string;
    verificationReport?: string;
  };
  _metadata: {
    generatedAt: string;
    usingRealIPFS: boolean;
    storageType: 'ipfs' | 'local';
    totalScore: number;
    pinataGateway?: string;
    publicGateways?: string[];
    verificationStatus: {
      income: boolean;
      balance: boolean;
      transactions: boolean;
      identity: boolean;
    };
  };
}

// Plaid Data Types
export interface PlaidAccountBalances {
  available?: number;
  current?: number;
  iso_currency_code?: string;
  limit?: number;
  unofficial_currency_code?: string;
}

export interface PlaidAccount {
  account_id: string;
  balances?: PlaidAccountBalances;
  name: string;
  official_name?: string;
  type: string;
  subtype: string;
  mask?: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
  pending?: boolean;
  account_id?: string;
  merchant_name?: string;
  payment_channel?: string;
}

export interface IncomeStream {
  confidence: number;
  days: number;
  monthly_income: number;
  name: string;
  status: string;
}

export interface PlaidIncome {
  income_streams: IncomeStream[];
  last_year_income: number;
  last_year_income_before_tax: number;
}

export interface PlaidIdentityAddress {
  data: {
    city: string;
    state: string;
    zip: string;
    country: string;
    street?: string;
  };
  primary: boolean;
}

export interface PlaidIdentity {
  names: string[];
  emails: Array<{ data: string; type: string }>;
  phone_numbers: Array<{ data: string; type: string }>;
  addresses: PlaidIdentityAddress[];
}

export interface PlaidData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  income?: PlaidIncome;
  identity?: PlaidIdentity;
}

export interface CreditData {
  address: string;
  creditScore: number;
  riskFactors: string[];
  creditBenefits: CreditBenefit[];
  walletData: WalletData;
  collateralAnalysis: CollateralAnalysis;
  oracleData: OracleData;
  protocolInteractions: ProtocolInteraction[];
  transactionAnalysis: TransactionAnalysis;
  zkProofs?: StoredZKProofs;
}

// Credit Score Specific Types
export interface CreditFactor {
  key: string;
  factor: string;
  score: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  metrics: string[];
}

export interface CreditScoreResult {
  creditScore: number;
  factors: CreditFactor[];
}

export interface CreditScoreWeights {
  ON_CHAIN_HISTORY: number;
  COLLATERAL_DIVERSITY: number;
  PROTOCOL_USAGE: number;
  FINANCIAL_HEALTH: number;
  REPAYMENT_HISTORY: number;
}

// IPFS Verification Types
export interface IPFSVerificationResult {
  verified: boolean;
  cid: string;
  gateway: string;
  timestamp: string;
  data?: any;
  error?: string;
}

export interface PinataStatus {
  available: boolean;
  hasJWT: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  publicGateways: string[];
}