"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSupplyChainTracking } from "@/hooks/useSupplyChainTracking";
import { useState } from "react";

export const SupplyChainTrackingDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // Supply Chain Tracking hook
  const supplyChain = useSupplyChainTracking({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Form states
  const [initForm, setInitForm] = useState({
    maxCostThreshold: "10000",
    minSupplierScoreThreshold: "70",
    maxRiskParamThreshold: "50",
    weight1: "10",
    weight2: "20",
    weight3: "30",
  });

  const [productForm, setProductForm] = useState({
    batchNumber: "",
    cost: "",
    supplierScore: "",
    riskParam: "",
  });

  const [productId, setProductId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showViewThresholds, setShowViewThresholds] = useState(false);
  const [showSetThresholds, setShowSetThresholds] = useState(false);
  type ThresholdKey = 'maxCostThreshold' | 'minSupplierScoreThreshold' | 'maxRiskParamThreshold' | 'weight1' | 'weight2' | 'weight3';
  const [thresholdsView, setThresholdsView] = useState<Record<ThresholdKey, string | bigint | boolean | undefined>>({
    maxCostThreshold: undefined,
    minSupplierScoreThreshold: undefined,
    maxRiskParamThreshold: undefined,
    weight1: undefined,
    weight2: undefined,
    weight3: undefined,
  });
  const [isDecryptingAll, setIsDecryptingAll] = useState(false);

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 font-bold text-white " +
    "transition-all duration-200 hover:bg-green-700 active:bg-green-800 shadow-lg hover:shadow-xl " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed";

  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 font-bold text-white " +
    "transition-all duration-200 hover:bg-red-700 active:bg-red-800 shadow-lg hover:shadow-xl " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed";

  const inputClass =
    "w-full px-4 py-3 border-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 bg-white";

  const cardClass = "bg-white rounded-xl shadow-xl p-8 border-2 border-gray-200";

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className={cardClass + " text-center max-w-md"}>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Wallet Connection Required
            </h2>
            <p className="text-gray-700 text-lg mb-8">
              Please connect your MetaMask wallet to access the Supply Chain Tracking system.
            </p>
          </div>
          <button className={primaryButtonClass + " w-full text-lg"} onClick={connect}>
            🔗 Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (supplyChain.isDeployed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className={cardClass + " text-center max-w-md border-red-300"}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-red-600 mb-3">
            Contract Not Found
          </h2>
          <p className="text-gray-700 text-lg">
            The SupplyChainTracking contract is not deployed on chain ID <span className="font-bold">{chainId}</span>.
            Please deploy the contract first.
          </p>
        </div>
      </div>
    );
  }

  const selectedProduct = selectedProductId !== null 
    ? supplyChain.products.get(selectedProductId) 
    : null;
  const decryptionEnabled = Boolean(
    selectedProduct?.complianceComputed && selectedProduct?.riskScoreComputed
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
                Supply Chain Tracking
              </h1>
              <p className="text-xl text-gray-700">
                Privacy-preserving supply chain management using FHEVM encryption
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-green-100 rounded-lg">
                <span className="text-sm font-semibold text-green-800">Products: {supplyChain.productCount}</span>
              </div>
              <div className="px-4 py-2 bg-red-100 rounded-lg">
                <span className="text-sm font-semibold text-red-800">Chain: {chainId}</span>
              </div>
            </div>
          </div>
          
          {/* Info Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-xs font-semibold text-gray-600 mb-1">WALLET ADDRESS</p>
              <p className="text-sm font-mono text-gray-900 truncate">{accounts?.[0]}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
              <p className="text-xs font-semibold text-gray-600 mb-1">CONTRACT ADDRESS</p>
              <p className="text-sm font-mono text-gray-900 truncate">{supplyChain.contractAddress}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
              <p className="text-xs font-semibold text-gray-600 mb-1">FHEVM STATUS</p>
              <p className="text-sm font-semibold text-gray-900 uppercase">{fhevmStatus}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Adjust Thresholds */}
          <div className={cardClass}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Adjust Thresholds</h2>
                <p className="text-sm text-gray-600">View and set encrypted thresholds</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={primaryButtonClass + " w-full"}
                onClick={async () => {
                  const initialized = await supplyChain.getThresholdsInitialized?.();
                  if (!initialized) {
                    supplyChain.notify?.("Thresholds are not initialized yet. Please set thresholds first.");
                    return;
                  }
                  setShowViewThresholds(true);
                }}
              >
                🔎 View Thresholds
              </button>
              <button
                className={secondaryButtonClass + " w-full"}
                disabled={!supplyChain.isOwner}
                onClick={() => setShowSetThresholds(true)}
                title={supplyChain.isOwner ? "" : "Owner-only"}
              >
                ⚙️ Set Thresholds
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {supplyChain.isOwner ? "You are the contract owner." : "Only the contract owner can set thresholds."}
            </div>
          </div>

          {/* Right Column - Register Product */}
          <div className={cardClass}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Register New Product</h2>
                <p className="text-sm text-gray-600">Add a new product to the supply chain</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Batch Identifier
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={productForm.batchNumber}
                  placeholder="e.g., BATCH-2025-11-001-A"
                  onChange={(e) =>
                    setProductForm({ ...productForm, batchNumber: e.target.value })
                  }
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Cost
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    value={productForm.cost}
                    placeholder="0"
                    onChange={(e) =>
                      setProductForm({ ...productForm, cost: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Supplier Score
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    value={productForm.supplierScore}
                    placeholder="0-100"
                    onChange={(e) =>
                      setProductForm({ ...productForm, supplierScore: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Risk Parameter
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    value={productForm.riskParam}
                    placeholder="0"
                    onChange={(e) =>
                      setProductForm({ ...productForm, riskParam: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            
            <button
              className={primaryButtonClass + " w-full text-lg"}
              disabled={supplyChain.isRegistering}
              onClick={() =>
                supplyChain.registerProduct(
                  productForm.batchNumber,
                  parseInt(productForm.cost),
                  parseInt(productForm.supplierScore),
                  parseInt(productForm.riskParam)
                )
              }
            >
              {supplyChain.isRegistering ? "⏳ Registering..." : "➕ Register Product"}
            </button>
          </div>
        </div>

        {/* View Thresholds Modal */}
        {showViewThresholds && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowViewThresholds(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">View Thresholds</h3>
                  <div className="flex items-center gap-2">
                    <button
                      className={primaryButtonClass}
                      disabled={isDecryptingAll}
                      onClick={async () => {
                        setIsDecryptingAll(true);
                        try {
                          if (!supplyChain.contractAddress) return;
                          await supplyChain.allowThresholdDecryptionForCurrentUser?.();
                          const handles = await supplyChain.getThresholdHandles?.();
                          const keys: ThresholdKey[] = ['maxCostThreshold','minSupplierScoreThreshold','maxRiskParamThreshold','weight1','weight2','weight3'];
                          const updates: Partial<Record<ThresholdKey, string | bigint | boolean | undefined>> = {};
                          for (const key of keys) {
                            const handle = (handles as any)?.[key] as string | undefined;
                            if (handle) {
                              const res = await supplyChain.decryptValue(handle, supplyChain.contractAddress);
                              if (res !== undefined) {
                                updates[key] = res;
                              }
                            }
                          }
                          setThresholdsView(prev => ({ ...prev, ...updates }));
                        } finally {
                          setIsDecryptingAll(false);
                        }
                      }}
                    >
                      {isDecryptingAll ? "⏳ Decrypting..." : "🔓 Decrypt All"}
                    </button>
                    <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowViewThresholds(false)}>✖</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Encrypted values with on-demand decryption.</p>
                <div className="space-y-3">
                  {([
                    ['Max Cost Threshold', 'maxCostThreshold'],
                    ['Min Supplier Score', 'minSupplierScoreThreshold'],
                    ['Max Risk Parameter', 'maxRiskParamThreshold'],
                    ['Weight 1 (Cost)', 'weight1'],
                    ['Weight 2 (Supplier)', 'weight2'],
                    ['Weight 3 (Batch)', 'weight3'],
                  ] as [string, ThresholdKey][]).map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{label}</p>
                        <p className="text-sm font-mono text-gray-900">
                          {thresholdsView[key] !== undefined ? String(thresholdsView[key]) : '🔒 Encrypted'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button className={secondaryButtonClass} onClick={() => setShowViewThresholds(false)}>Close</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Set Thresholds Modal (Owner-only) */}
        {showSetThresholds && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSetThresholds(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Set Thresholds</h3>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowSetThresholds(false)}>✖</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Max Cost Threshold</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={initForm.maxCostThreshold}
                      onChange={(e) => setInitForm({ ...initForm, maxCostThreshold: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Min Supplier Score</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={initForm.minSupplierScoreThreshold}
                      onChange={(e) => setInitForm({ ...initForm, minSupplierScoreThreshold: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Max Risk Parameter</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={initForm.maxRiskParamThreshold}
                      onChange={(e) => setInitForm({ ...initForm, maxRiskParamThreshold: e.target.value })}
                    />
                  </div>
                </div>
                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-800 mb-3">Weights</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Weight 1 (Cost)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={initForm.weight1}
                        onChange={(e) => setInitForm({ ...initForm, weight1: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Weight 2 (Supplier)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={initForm.weight2}
                        onChange={(e) => setInitForm({ ...initForm, weight2: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Weight 3 (Batch)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={initForm.weight3}
                        onChange={(e) => setInitForm({ ...initForm, weight3: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button className={secondaryButtonClass} onClick={() => setShowSetThresholds(false)}>Cancel</button>
                  <button
                    className={primaryButtonClass}
                    disabled={supplyChain.isAdjusting || !supplyChain.isOwner}
                    onClick={async () => {
                      await supplyChain.adjustThresholds(
                        parseInt(initForm.maxCostThreshold),
                        parseInt(initForm.minSupplierScoreThreshold),
                        parseInt(initForm.maxRiskParamThreshold),
                        parseInt(initForm.weight1),
                        parseInt(initForm.weight2),
                        parseInt(initForm.weight3)
                      );
                    }}
                  >
                    {supplyChain.isAdjusting ? "⏳ Submitting..." : "✅ Submit"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Product Operations Section */}
        <div className={cardClass}>
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Product Operations</h2>
              <p className="text-sm text-gray-600">Query and analyze product information</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Product ID
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                className={inputClass + " flex-1"}
                placeholder="Enter Product ID"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <button
                className={primaryButtonClass}
                onClick={() => {
                  const id = parseInt(productId);
                  if (!isNaN(id)) {
                    setSelectedProductId(id);
                    supplyChain.refreshProductInfo(id);
                  }
                }}
              >
                🔍 Load
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              className={secondaryButtonClass + " w-full"}
              disabled={!productId || supplyChain.isCheckingCompliance}
              onClick={() => supplyChain.checkCompliance(parseInt(productId))}
            >
              {supplyChain.isCheckingCompliance
                ? "⏳ Checking..."
                : "✓ Check Compliance"}
            </button>
            <button
              className={secondaryButtonClass + " w-full"}
              disabled={!productId || supplyChain.isCalculatingRisk}
              onClick={() => supplyChain.calculateRiskScore(parseInt(productId))}
            >
              {supplyChain.isCalculatingRisk
                ? "⏳ Calculating..."
                : "📊 Calculate Risk Score"}
            </button>
          </div>
        </div>

        {/* Product Details */}
        {selectedProduct && (
          <div className={cardClass + " border-green-300"}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Product #{selectedProductId}</h2>
                  <p className="text-sm text-gray-600">Detailed information and encryption status</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-600 mb-2">OWNER ADDRESS</p>
                <p className="font-mono text-sm text-gray-900 break-all">{selectedProduct.owner}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-600 mb-2">TIMESTAMP</p>
                <p className="text-sm text-gray-900">{selectedProduct.timestamp?.toString()}</p>
              </div>
              
              {!decryptionEnabled && (
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <p className="text-sm text-yellow-900">
                    Decryption is disabled until both COMPLIANCE and RISK SCORE are computed. Please click
                    "Check Compliance" and "Calculate Risk Score" first.
                  </p>
                </div>
              )}
              
              {selectedProduct.isCompliant && (
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-green-800 mb-2">COMPLIANCE STATUS</p>
                      <p className="text-lg font-bold text-green-900">
                        {selectedProduct.isCompliant.clear !== undefined
                          ? (selectedProduct.isCompliant.clear ? "✓ Compliant" : "✗ Non-Compliant")
                          : "🔒 Encrypted"}
                      </p>
                    </div>
                    {selectedProduct.isCompliant.clear === undefined && (
                      <button
                        className={primaryButtonClass}
                        disabled={!decryptionEnabled}
                        title={!decryptionEnabled ? 'Compute compliance and risk score first' : undefined}
                        onClick={async () => {
                          if (selectedProduct.isCompliant?.handle && supplyChain.contractAddress) {
                            await supplyChain.decryptValue(
                              selectedProduct.isCompliant.handle,
                              supplyChain.contractAddress,
                              selectedProductId ?? undefined,
                              'isCompliant'
                            );
                          }
                        }}
                      >
                        🔓 Decrypt
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {selectedProduct.riskFlag && (
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-800 mb-2">RISK FLAG</p>
                      <p className="text-lg font-bold text-red-900">
                        {selectedProduct.riskFlag.clear !== undefined
                          ? (selectedProduct.riskFlag.clear ? "⚠️ Flagged" : "✓ Safe")
                          : "🔒 Encrypted"}
                      </p>
                    </div>
                    {selectedProduct.riskFlag.clear === undefined && (
                      <button
                        className={primaryButtonClass}
                        disabled={!decryptionEnabled}
                        title={!decryptionEnabled ? 'Compute compliance and risk score first' : undefined}
                        onClick={async () => {
                          if (selectedProduct.riskFlag?.handle && supplyChain.contractAddress) {
                            await supplyChain.decryptValue(
                              selectedProduct.riskFlag.handle,
                              supplyChain.contractAddress,
                              selectedProductId ?? undefined,
                              'riskFlag'
                            );
                          }
                        }}
                      >
                        🔓 Decrypt
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {selectedProduct.riskScore && (
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-2">RISK SCORE</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedProduct.riskScore.clear !== undefined
                          ? `Score: ${selectedProduct.riskScore.clear.toString()}`
                          : "🔒 Encrypted"}
                      </p>
                    </div>
                    {selectedProduct.riskScore.clear === undefined && (
                      <button
                        className={primaryButtonClass}
                        disabled={!decryptionEnabled}
                        title={!decryptionEnabled ? 'Compute compliance and risk score first' : undefined}
                        onClick={async () => {
                          if (selectedProduct.riskScore?.handle && supplyChain.contractAddress) {
                            await supplyChain.decryptValue(
                              selectedProduct.riskScore.handle,
                              supplyChain.contractAddress,
                              selectedProductId ?? undefined,
                              'riskScore'
                            );
                          }
                        }}
                      >
                        🔓 Decrypt
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {supplyChain.message && (
          <div className="fixed bottom-6 right-6 max-w-md">
            <div className="bg-white rounded-lg shadow-2xl p-5 border-l-4 border-green-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{supplyChain.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

