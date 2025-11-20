// Type declaration for @fhevm/mock-utils
// This module is only used in development with Hardhat and is dynamically imported
// It's ignored in production builds via webpack configuration

declare module "@fhevm/mock-utils" {
  export class MockFhevmInstance {
    static create(
      provider: any,
      gatewayProvider: any,
      config: {
        aclContractAddress: string;
        chainId: number;
        gatewayChainId: number;
        inputVerifierContractAddress: string;
        kmsContractAddress: string;
        verifyingContractAddressDecryption: string;
        verifyingContractAddressInputVerification: string;
      },
      properties?: {
        inputVerifierProperties?: Record<string, any>;
        kmsVerifierProperties?: Record<string, any>;
      }
    ): Promise<MockFhevmInstance>;
    
    getPublicKey(): string;
    getPublicParams(size: number): string;
    [key: string]: any;
  }
}

