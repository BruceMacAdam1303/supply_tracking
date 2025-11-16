"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { SupplyChainTrackingAddresses } from "@/abi/SupplyChainTrackingAddresses";
import { SupplyChainTrackingABI } from "@/abi/SupplyChainTrackingABI";

export type ClearValueType = {
  handle: string;
  clear?: string | bigint | boolean;
};

type SupplyChainTrackingInfoType = {
  abi: typeof SupplyChainTrackingABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getSupplyChainTrackingByChainId(
  chainId: number | undefined
): SupplyChainTrackingInfoType {
  if (!chainId) {
    return { abi: SupplyChainTrackingABI.abi };
  }

  const entry =
    SupplyChainTrackingAddresses[chainId.toString() as keyof typeof SupplyChainTrackingAddresses];

  if (!entry?.address || entry?.address === ethers.ZeroAddress) {
    return { abi: SupplyChainTrackingABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: SupplyChainTrackingABI.abi,
  };
}

export const useSupplyChainTracking = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [productCount, setProductCount] = useState<number>(0);
  const [products, setProducts] = useState<Map<number, {
    batchNumber?: string;
    cost?: string;
    supplierScore?: string;
    riskParam?: string;
    isCompliant?: ClearValueType;
    riskFlag?: ClearValueType;
    riskScore?: ClearValueType;
    owner?: string;
    timestamp?: bigint;
    complianceComputed?: boolean;
    riskScoreComputed?: boolean;
  }>>(new Map());
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState<boolean>(false);
  const [isCalculatingRisk, setIsCalculatingRisk] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [ownerAddress, setOwnerAddress] = useState<string | undefined>(undefined);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Public notifier for bottom-right toast
  const notify = useCallback((text: string) => {
    setMessage(text);
  }, []);

  const contractRef = useRef<SupplyChainTrackingInfoType | undefined>(undefined);

  const contract = useMemo(() => {
    const c = getSupplyChainTrackingByChainId(chainId);
    contractRef.current = c;
    // Only show deployment not found message when chainId is defined and address is missing
    // Don't show message when chainId is undefined (wallet not connected) or when address exists
    if (chainId !== undefined && !c.address) {
      setMessage(`SupplyChainTracking deployment not found for chainId=${chainId}.`);
    } else if (chainId !== undefined && c.address) {
      // Clear any previous deployment not found message when address is available
      setMessage((prev) => {
        if (prev.includes("deployment not found")) {
          return "";
        }
        return prev;
      });
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!contract) {
      return undefined;
    }
    return (Boolean(contract.address) && contract.address !== ethers.ZeroAddress);
  }, [contract]);

  // Resolve contract owner and permission
  useEffect(() => {
    let cancelled = false;
    async function loadOwner() {
      if (!contract.address || !ethersReadonlyProvider) {
        setOwnerAddress(undefined);
        setIsOwner(false);
        return;
      }
      try {
        const c = new ethers.Contract(contract.address, contract.abi, ethersReadonlyProvider);
        const owner: string = await c.owner();
        if (!cancelled) {
          setOwnerAddress(owner);
          const signerAddr = await ethersSigner?.getAddress();
          setIsOwner(Boolean(signerAddr) && owner?.toLowerCase() === signerAddr?.toLowerCase());
        }
      } catch {
        if (!cancelled) {
          setOwnerAddress(undefined);
          setIsOwner(false);
        }
      }
    }
    loadOwner();
    return () => {
      cancelled = true;
    };
  }, [contract.address, contract.abi, ethersReadonlyProvider, ethersSigner]);

  // Adjust thresholds (owner-only)
  const adjustThresholds = useCallback(async (
    maxCostThreshold: number,
    minSupplierScoreThreshold: number,
    maxRiskParamThreshold: number,
    weight1: number,
    weight2: number,
    weight3: number
  ) => {
    if (!contract.address || !instance || !ethersSigner) {
      setMessage("Contract, instance, or signer not available");
      return;
    }

    setIsAdjusting(true);
    setMessage("Adjusting thresholds...");

    try {
      const input = instance.createEncryptedInput(
        contract.address,
        ethersSigner.address
      );
      input.add32(maxCostThreshold);
      input.add32(minSupplierScoreThreshold);
      input.add32(maxRiskParamThreshold);
      input.add32(weight1);
      input.add32(weight2);
      input.add32(weight3);

      const enc = await input.encrypt();

      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersSigner
      );

      const tx = await contractInstance.adjustThresholds(
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.handles[4],
        enc.handles[5],
        enc.inputProof
      );

      setMessage(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage(`✓ Thresholds successfully adjusted!`);
    } catch (error) {
      setMessage(`Failed to adjust thresholds: ${error}`);
    } finally {
      setIsAdjusting(false);
    }
  }, [contract.address, contract.abi, instance, ethersSigner]);

  // Decrypt a threshold value by key (requires contract to expose handles)
  const decryptThreshold = useCallback(async (
    key: 'maxCostThreshold' | 'minSupplierScoreThreshold' | 'maxRiskParamThreshold' | 'weight1' | 'weight2' | 'weight3'
  ): Promise<bigint | boolean | `0x${string}` | undefined> => {
    if (!instance || !ethersSigner || !contract.address) {
      setMessage("Contract, instance, or signer not available");
      return undefined;
    }
    // Prefer using getThresholdHandles + allowThresholdDecryptionForCurrentUser, then decrypt via decryptValue
    setMessage(`Please use 'Decrypt All' to decrypt thresholds.`);
    return undefined;
  }, [instance, ethersSigner, contract.address]);

  // Grant permission for current user to decrypt thresholds
  const allowThresholdDecryptionForCurrentUser = useCallback(async (): Promise<void> => {
    if (!contract.address || !ethersSigner) {
      setMessage("Contract or signer not available");
      return;
    }
    try {
      const user = await ethersSigner.getAddress();
      const c = new ethers.Contract(contract.address, contract.abi, ethersSigner);
      const tx = await c.allowThresholdDecryptionFor(user);
      setMessage(`Authorize decryption: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage("✓ Decryption permission granted for thresholds");
    } catch (error) {
      setMessage(`Failed to authorize decryption: ${error}`);
    }
  }, [contract.address, contract.abi, ethersSigner]);

  // Get threshold handles from contract
  const getThresholdHandles = useCallback(async (): Promise<{
    maxCostThreshold?: `0x${string}`;
    minSupplierScoreThreshold?: `0x${string}`;
    maxRiskParamThreshold?: `0x${string}`;
    weight1?: `0x${string}`;
    weight2?: `0x${string}`;
    weight3?: `0x${string}`;
  }> => {
    if (!contract.address || !ethersReadonlyProvider) {
      return {};
    }
    try {
      const c = new ethers.Contract(contract.address, contract.abi, ethersReadonlyProvider);
      const res = await c.getThresholdHandles();
      const arr = Array.isArray(res) ? res : [
        res.maxCostThreshold,
        res.minSupplierScoreThreshold,
        res.maxRiskParamThreshold,
        res.weight1,
        res.weight2,
        res.weight3,
      ];
      return {
        maxCostThreshold: arr[0],
        minSupplierScoreThreshold: arr[1],
        maxRiskParamThreshold: arr[2],
        weight1: arr[3],
        weight2: arr[4],
        weight3: arr[5],
      } as any;
    } catch (error) {
      setMessage(`Failed to fetch threshold handles: ${error}`);
      return {};
    }
  }, [contract.address, contract.abi, ethersReadonlyProvider]);

  // Check if thresholds are initialized
  const getThresholdsInitialized = useCallback(async (): Promise<boolean> => {
    if (!contract.address || !ethersReadonlyProvider) {
      return false;
    }
    try {
      const c = new ethers.Contract(contract.address, contract.abi, ethersReadonlyProvider);
      const initialized: boolean = await c.thresholdsInitialized();
      return initialized;
    } catch {
      return false;
    }
  }, [contract.address, contract.abi, ethersReadonlyProvider]);

  // Register product
  const registerProduct = useCallback(async (
    batchNumberText: string,
    cost: number,
    supplierScore: number,
    riskParam: number
  ) => {
    if (!contract.address || !instance || !ethersSigner) {
      setMessage("Contract, instance, or signer not available");
      return;
    }

    setIsRegistering(true);
    setMessage("Registering product...");

    try {
      // Derive a 32-bit fingerprint from the batchNumber string (client-side hashing)
      // We use keccak256(utf8(string)) and take the first 4 bytes as uint32
      const hash = ethers.keccak256(ethers.toUtf8Bytes(batchNumberText ?? ""));
      const first4BytesHex = hash.slice(2, 10);
      const batchNumber = parseInt(first4BytesHex, 16);

      const input = instance.createEncryptedInput(
        contract.address,
        ethersSigner.address
      );
      input.add32(batchNumber);
      input.add32(cost);
      input.add32(supplierScore);
      input.add32(riskParam);

      const enc = await input.encrypt();

      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersSigner
      );

      const tx = await contractInstance.registerProduct(
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.handles[3],
        enc.inputProof
      );

      setMessage(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage(`✓ Product successfully registered!`);
      
      // Refresh product count
      refreshProductCount();
    } catch (error) {
      setMessage(`Failed to register product: ${error}`);
    } finally {
      setIsRegistering(false);
    }
  }, [contract.address, contract.abi, instance, ethersSigner]);

  // Check compliance
  const checkCompliance = useCallback(async (productId: number) => {
    if (!contract.address || !ethersSigner) {
      setMessage("Contract or signer not available");
      return;
    }

    setIsCheckingCompliance(true);
    setMessage(`Checking compliance for product ${productId}...`);

    try {
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersSigner
      );

      const tx = await contractInstance.checkCompliance(productId);
      setMessage(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage(`✓ Compliance check completed successfully!`);
      
      // Refresh product info
      refreshProductInfo(productId);
      // Mark as computed
      setProducts(prev => {
        const newMap = new Map(prev);
        const p = newMap.get(productId);
        if (p) {
          newMap.set(productId, { ...p, complianceComputed: true });
        }
        return newMap;
      });
    } catch (error) {
      setMessage(`Failed to check compliance: ${error}`);
    } finally {
      setIsCheckingCompliance(false);
    }
  }, [contract.address, contract.abi, ethersSigner]);

  // Calculate risk score
  const calculateRiskScore = useCallback(async (productId: number) => {
    if (!contract.address || !ethersSigner) {
      setMessage("Contract or signer not available");
      return;
    }

    setIsCalculatingRisk(true);
    setMessage(`Calculating risk score for product ${productId}...`);

    try {
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersSigner
      );

      const tx = await contractInstance.calculateRiskScore(productId);
      setMessage(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage(`✓ Risk score calculated successfully!`);
      
      // Refresh product info
      refreshProductInfo(productId);
      // Mark as computed
      setProducts(prev => {
        const newMap = new Map(prev);
        const p = newMap.get(productId);
        if (p) {
          newMap.set(productId, { ...p, riskScoreComputed: true });
        }
        return newMap;
      });
    } catch (error) {
      setMessage(`Failed to calculate risk score: ${error}`);
    } finally {
      setIsCalculatingRisk(false);
    }
  }, [contract.address, contract.abi, ethersSigner]);

  // Allow current user to decrypt compliance-related fields for a product
  const allowProductComplianceDecryptionForCurrentUser = useCallback(async (
    productId: number
  ): Promise<boolean> => {
    if (!contract.address || !ethersSigner) {
      setMessage("Contract or signer not available.");
      return false;
    }
    try {
      const contractInstance = new ethers.Contract(contract.address, contract.abi, ethersSigner);
      const tx = await contractInstance.allowProductComplianceDecryptionFor(
        productId,
        await ethersSigner.getAddress()
      );
      setMessage(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      setMessage("✓ Decryption permission granted for compliance fields!");
      return true;
    } catch (error) {
      setMessage(`Failed to grant decryption permission: ${error}`);
      return false;
    }
  }, [contract.address, contract.abi, ethersSigner]);

  // Decrypt value
  const decryptValue = useCallback(async (
    handle: string,
    contractAddress: string,
    productId?: number,
    fieldName?: 'isCompliant' | 'riskFlag' | 'riskScore'
  ): Promise<bigint | boolean | `0x${string}` | undefined> => {
    if (!instance || !ethersSigner || !handle || handle === ethers.ZeroHash) {
      return undefined;
    }

    setIsDecrypting(true);
    setMessage("Decrypting value...");

    try {
      // If decrypting compliance-related fields, first grant permission
      if (productId !== undefined && fieldName && ethersSigner) {
        const userAddress = await ethersSigner.getAddress();
        try {
          await allowProductComplianceDecryptionForCurrentUser(productId);
        } catch (error) {
          // Continue even if permission grant fails (might already have permission)
          console.log("Permission grant attempt:", error);
        }
      }

      const sig: FhevmDecryptionSignature | null =
        await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return undefined;
      }

      const res = await instance.userDecrypt(
        [{ handle, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const decryptedValue = res[handle as `0x${string}`];
      
      // Update the product info with decrypted value
      if (productId !== undefined && fieldName && decryptedValue !== undefined) {
        setProducts(prev => {
          const newMap = new Map(prev);
          const product = newMap.get(productId);
          if (product) {
            const updatedProduct = { ...product };
            if (fieldName === 'isCompliant' && product.isCompliant) {
              updatedProduct.isCompliant = { ...product.isCompliant, clear: decryptedValue };
            } else if (fieldName === 'riskFlag' && product.riskFlag) {
              updatedProduct.riskFlag = { ...product.riskFlag, clear: decryptedValue };
            } else if (fieldName === 'riskScore' && product.riskScore) {
              updatedProduct.riskScore = { ...product.riskScore, clear: decryptedValue };
            }
            newMap.set(productId, updatedProduct);
          }
          return newMap;
        });
      }

      if (decryptedValue !== undefined) {
        setMessage("✓ Value decrypted successfully!");
        return decryptedValue;
      } else {
        setMessage("Decryption failed. Ensure compliance and risk score are computed and permissions are granted.");
        return undefined;
      }
    } catch (error) {
      setMessage(`Failed to decrypt: ${error}`);
      return undefined;
    } finally {
      setIsDecrypting(false);
    }
  }, [instance, ethersSigner, fhevmDecryptionSignatureStorage, allowProductComplianceDecryptionForCurrentUser]);

  // Refresh product count
  const refreshProductCount = useCallback(async () => {
    if (!contract.address || !ethersReadonlyProvider) {
      return;
    }

    try {
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersReadonlyProvider
      );

      const count = await contractInstance.getProductCount();
      setProductCount(Number(count));
    } catch (error) {
      console.error("Failed to get product count:", error);
    }
  }, [contract.address, contract.abi, ethersReadonlyProvider]);

  // Refresh product info
  const refreshProductInfo = useCallback(async (productId: number) => {
    if (!contract.address || !ethersReadonlyProvider) {
      return;
    }

    try {
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        ethersReadonlyProvider
      );

      const info = await contractInstance.getProductInfo(productId);
      
      setProducts(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(productId);
        newMap.set(productId, {
          batchNumber: info.batchNumber,
          cost: info.cost,
          supplierScore: info.supplierScore,
          riskParam: info.riskParam,
          isCompliant: { handle: info.isCompliant, clear: undefined },
          riskFlag: { handle: info.riskFlag, clear: undefined },
          riskScore: { handle: info.riskScore, clear: undefined },
          owner: info.productOwner, // Contract returns productOwner
          timestamp: info.timestamp,
          // preserve existing computed flags; they are set on successful txs
          complianceComputed: existing?.complianceComputed ?? false,
          riskScoreComputed: existing?.riskScoreComputed ?? false,
        });
        return newMap;
      });
    } catch (error) {
      console.error("Failed to get product info:", error);
    }
  }, [contract.address, contract.abi, ethersReadonlyProvider]);

  // Auto refresh product count
  useEffect(() => {
    refreshProductCount();
  }, [refreshProductCount]);

  return {
    contractAddress: contract.address,
    isDeployed,
    productCount,
    products,
    isAdjusting,
    isRegistering,
    isCheckingCompliance,
    isCalculatingRisk,
    isDecrypting,
    message,
    adjustThresholds,
    decryptThreshold,
    allowThresholdDecryptionForCurrentUser,
    getThresholdHandles,
    getThresholdsInitialized,
    registerProduct,
    checkCompliance,
    calculateRiskScore,
    decryptValue,
    refreshProductCount,
    refreshProductInfo,
    ownerAddress,
    isOwner,
    notify,
  };
};

