export interface PinataPinResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}
export interface PinataPinJSONResponse extends PinataPinResponse {
    isDuplicate?: boolean;
}
export declare class PinataService {
    private apiKey;
    private apiSecret;
    private jwt;
    private customGateway;
    constructor();
    get credentialsValid(): boolean;
    getIPFSGatewayURL(cid: string): string;
    private storeWithExampleCID;
    pinJSONToIPFS(data: any, name: string): Promise<any>;
    pinFileToIPFS(file: File, name: string): Promise<any>;
}
export declare const pinataService: PinataService;
//# sourceMappingURL=pinataService.d.ts.map