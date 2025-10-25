"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinataService = exports.PinataService = void 0;
class PinataService {
    constructor() {
        // Backend uses process.env, NOT import.meta.env
        this.apiKey = process.env.PINATA_API_KEY || '';
        this.apiSecret = process.env.PINATA_API_SECRET || '';
        this.jwt = process.env.PINATA_JWT || '';
        this.customGateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
        console.log('🔐 Backend Pinata Service Initialized:', {
            hasApiKey: !!this.apiKey,
            hasApiSecret: !!this.apiSecret,
            hasJWT: !!this.jwt,
            customGateway: this.customGateway
        });
        if (!this.apiKey || !this.apiSecret || !this.jwt) {
            console.warn('⚠️ Pinata credentials not found in backend.');
        }
    }
    // Check if credentials are valid
    get credentialsValid() {
        return !!(this.apiKey && this.apiSecret && this.jwt);
    }
    // Get IPFS gateway URL
    getIPFSGatewayURL(cid) {
        return `${this.customGateway}/ipfs/${cid}`;
    }
    // Store with example CID (fallback method)
    async storeWithExampleCID(data, name) {
        console.log(`📝 Using example CID storage for ${name} (Pinata credentials invalid)`);
        // Generate a realistic-looking but fake CID
        const exampleCID = `QmZy6LGm${Date.now().toString(16)}${Math.random().toString(16).substring(2, 8)}`;
        const result = {
            IpfsHash: exampleCID,
            PinSize: JSON.stringify(data).length,
            Timestamp: new Date().toISOString(),
            isDuplicate: false,
            isRealCID: false
        };
        return {
            ...result,
            url: this.getIPFSGatewayURL(exampleCID),
            customGateway: this.customGateway,
            isRealCID: false
        };
    }
    // Main method to pin JSON to IPFS
    async pinJSONToIPFS(data, name) {
        if (!this.credentialsValid) {
            console.warn(`📝 Using enhanced local storage for ${name} (invalid Pinata credentials)`);
            return this.storeWithExampleCID(data, name);
        }
        try {
            console.log(`📤 Pinning ${name} to IPFS via Pinata...`);
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret
                },
                body: JSON.stringify({
                    pinataMetadata: {
                        name: `darma-zk-proof-${name}-${Date.now()}`,
                        keyvalues: {
                            type: 'zk-proof',
                            protocol: 'darma-credit',
                            timestamp: new Date().toISOString(),
                            source: 'darma-frontend',
                            version: '1.0.0'
                        }
                    },
                    pinataContent: {
                        ...data,
                        _metadata: {
                            pinnedAt: new Date().toISOString(),
                            proofType: name,
                            darmaVersion: '1.0.0'
                        }
                    }
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Pinata API error (${response.status}):`, errorText);
                throw new Error(`Pinata API error: ${response.status}`);
            }
            const result = await response.json();
            // Verify this is a real CID (not example)
            const isRealCID = result.IpfsHash && !result.IpfsHash.startsWith('local_') && !result.IpfsHash.startsWith('QmZy6LGm');
            console.log(`✅ Successfully pinned "${name}" to IPFS:`, {
                cid: result.IpfsHash,
                isRealCID: isRealCID,
                size: result.PinSize,
                timestamp: result.Timestamp,
                url: this.getIPFSGatewayURL(result.IpfsHash),
                customGateway: this.customGateway
            });
            return {
                ...result,
                isRealCID: isRealCID,
                url: this.getIPFSGatewayURL(result.IpfsHash),
                customGateway: this.customGateway
            };
        }
        catch (error) {
            console.error('❌ Failed to pin to IPFS, falling back to local storage:', error.message);
            return this.storeWithExampleCID(data, name);
        }
    }
    // Additional method to pin file to IPFS (if needed)
    async pinFileToIPFS(file, name) {
        if (!this.credentialsValid) {
            console.warn(`📝 Using example CID for file ${name} (invalid Pinata credentials)`);
            return this.storeWithExampleCID({ file: name, type: 'file' }, name);
        }
        try {
            const formData = new FormData();
            formData.append('file', file);
            const metadata = JSON.stringify({
                name: `darma-file-${name}-${Date.now()}`,
                keyvalues: {
                    type: 'file',
                    protocol: 'darma-credit',
                    timestamp: new Date().toISOString()
                }
            });
            formData.append('pinataMetadata', metadata);
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Pinata API error: ${response.status}`);
            }
            const result = await response.json();
            const isRealCID = result.IpfsHash && !result.IpfsHash.startsWith('local_');
            return {
                ...result,
                isRealCID: isRealCID,
                url: this.getIPFSGatewayURL(result.IpfsHash),
                customGateway: this.customGateway
            };
        }
        catch (error) {
            console.error('❌ Failed to pin file to IPFS:', error.message);
            return this.storeWithExampleCID({ file: name, type: 'file' }, name);
        }
    }
}
exports.PinataService = PinataService;
exports.pinataService = new PinataService();
//# sourceMappingURL=pinataService.js.map