// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Supply Chain Tracking with FHEVM
/// @notice A privacy-preserving supply chain tracking system using FHEVM
/// @dev All sensitive data (cost, supplier score, risk parameters) are encrypted
contract SupplyChainTracking is ZamaEthereumConfig {
    // Structure to store encrypted product information
    struct ProductInfo {
        euint32 batchNumber;      // Encrypted batch number
        euint32 cost;             // Encrypted cost
        euint32 supplierScore;    // Encrypted supplier trust score
        euint32 riskParam;        // Encrypted risk parameter
        euint32 isCompliant;      // Encrypted compliance flag (0 or 1)
        euint32 riskFlag;         // Encrypted risk flag (0 or 1)
        euint32 riskScore;        // Encrypted risk score
        address owner;            // Product owner (unencrypted)
        uint256 timestamp;        // Timestamp when product was registered
    }

    // Mapping from product ID to ProductInfo
    mapping(uint256 => ProductInfo) public products;
    
    // Counter for product IDs
    uint256 public productCounter;
    
    // Compliance thresholds (encrypted)
    euint32 private _maxCostThreshold;
    euint32 private _minSupplierScoreThreshold;
    euint32 private _maxRiskParamThreshold;
    
    // Risk calculation weights (encrypted)
    euint32 private _weight1; // Cost factor weight
    euint32 private _weight2; // Supplier risk weight
    euint32 private _weight3; // Batch history weight
    
    // Owner address for setting thresholds
    address public owner;
    bool private _thresholdsInitialized;

    event ProductRegistered(uint256 indexed productId, address indexed owner);
    event ComplianceChecked(uint256 indexed productId);
    event RiskCalculated(uint256 indexed productId);
    event ThresholdsAdjusted(address indexed actor);

    constructor() {
        owner = msg.sender;
        _thresholdsInitialized = false;
    }

    /// @notice Adjust thresholds and weights (owner-only, callable anytime)
    /// @dev This method can be called multiple times. It sets encrypted thresholds and weights.
    ///      The values are used for compliance checks and risk scoring.
    /// @param maxCostThreshold Encrypted maximum cost threshold
    /// @param minSupplierScoreThreshold Encrypted minimum supplier score threshold
    /// @param maxRiskParamThreshold Encrypted maximum risk parameter threshold
    /// @param weight1 Encrypted weight for cost component (0-100 recommended)
    /// @param weight2 Encrypted weight for supplier component (0-100 recommended)
    /// @param weight3 Encrypted weight for risk parameter component (0-100 recommended)
    /// @param inputProof Proof for all external inputs
    function adjustThresholds(
        externalEuint32 maxCostThreshold,
        externalEuint32 minSupplierScoreThreshold,
        externalEuint32 maxRiskParamThreshold,
        externalEuint32 weight1,
        externalEuint32 weight2,
        externalEuint32 weight3,
        bytes calldata inputProof
    ) external {
        require(msg.sender == owner, "Only owner can adjust thresholds");
        
        _maxCostThreshold = FHE.fromExternal(maxCostThreshold, inputProof);
        _minSupplierScoreThreshold = FHE.fromExternal(minSupplierScoreThreshold, inputProof);
        _maxRiskParamThreshold = FHE.fromExternal(maxRiskParamThreshold, inputProof);
        _weight1 = FHE.fromExternal(weight1, inputProof);
        _weight2 = FHE.fromExternal(weight2, inputProof);
        _weight3 = FHE.fromExternal(weight3, inputProof);
        
        // Allow contract to decrypt these values
        FHE.allowThis(_maxCostThreshold);
        FHE.allowThis(_minSupplierScoreThreshold);
        FHE.allowThis(_maxRiskParamThreshold);
        FHE.allowThis(_weight1);
        FHE.allowThis(_weight2);
        FHE.allowThis(_weight3);
        
        _thresholdsInitialized = true;
        emit ThresholdsAdjusted(msg.sender);
    }

    /// @notice Returns whether thresholds have been initialized/set
    function thresholdsInitialized() external view returns (bool) {
        return _thresholdsInitialized;
    }

    /// @notice Register a new product with encrypted information
    /// @param batchNumber Encrypted batch number
    /// @param cost Encrypted cost
    /// @param supplierScore Encrypted supplier trust score
    /// @param riskParam Encrypted risk parameter
    /// @param inputProof Proof for all external inputs
    function registerProduct(
        externalEuint32 batchNumber,
        externalEuint32 cost,
        externalEuint32 supplierScore,
        externalEuint32 riskParam,
        bytes calldata inputProof
    ) external {
        uint256 productId = productCounter++;
        
        // Convert external encrypted values to internal encrypted values
        euint32 encryptedBatchNumber = FHE.fromExternal(batchNumber, inputProof);
        euint32 encryptedCost = FHE.fromExternal(cost, inputProof);
        euint32 encryptedSupplierScore = FHE.fromExternal(supplierScore, inputProof);
        euint32 encryptedRiskParam = FHE.fromExternal(riskParam, inputProof);
        
        // Initialize compliance and risk flags to 0 (will be calculated)
        euint32 zero = FHE.asEuint32(0);
        euint32 zeroRiskScore = FHE.asEuint32(0);
        
        products[productId] = ProductInfo({
            batchNumber: encryptedBatchNumber,
            cost: encryptedCost,
            supplierScore: encryptedSupplierScore,
            riskParam: encryptedRiskParam,
            isCompliant: zero,
            riskFlag: zero,
            riskScore: zeroRiskScore,
            owner: msg.sender,
            timestamp: block.timestamp
        });
        
        // Allow contract and owner to decrypt these values
        FHE.allowThis(encryptedBatchNumber);
        FHE.allow(encryptedBatchNumber, msg.sender);
        FHE.allowThis(encryptedCost);
        FHE.allow(encryptedCost, msg.sender);
        FHE.allowThis(encryptedSupplierScore);
        FHE.allow(encryptedSupplierScore, msg.sender);
        FHE.allowThis(encryptedRiskParam);
        FHE.allow(encryptedRiskParam, msg.sender);
        
        emit ProductRegistered(productId, msg.sender);
    }

    /// @notice Check compliance of a product using encrypted values
    /// @param productId The product ID to check
    /// @dev Performs compliance checks in encrypted form:
    ///      - Cost must be <= maxCostThreshold
    ///      - Supplier score must be >= minSupplierScoreThreshold
    ///      - Risk parameter must be <= maxRiskParamThreshold
    function checkCompliance(uint256 productId) external {
        require(_thresholdsInitialized, "Thresholds not initialized");
        ProductInfo storage product = products[productId];
        require(product.owner != address(0), "Product does not exist");
        
        // Check cost compliance: cost <= maxCostThreshold
        ebool costCompliantBool = FHE.le(product.cost, _maxCostThreshold);
        euint32 costCompliant = FHE.select(costCompliantBool, FHE.asEuint32(1), FHE.asEuint32(0));
        
        // Check supplier score compliance: supplierScore >= minSupplierScoreThreshold
        ebool supplierCompliantBool = FHE.ge(product.supplierScore, _minSupplierScoreThreshold);
        euint32 supplierCompliant = FHE.select(supplierCompliantBool, FHE.asEuint32(1), FHE.asEuint32(0));
        
        // Check risk parameter compliance: riskParam <= maxRiskParamThreshold
        ebool riskCompliantBool = FHE.le(product.riskParam, _maxRiskParamThreshold);
        euint32 riskCompliant = FHE.select(riskCompliantBool, FHE.asEuint32(1), FHE.asEuint32(0));
        
        // All three conditions must be true for compliance
        // Using multiplication as AND operation (all must be 1)
        euint32 allCompliant = FHE.mul(costCompliant, supplierCompliant);
        allCompliant = FHE.mul(allCompliant, riskCompliant);
        
        product.isCompliant = allCompliant;
        
        // Set risk flag: if not compliant, set risk flag to 1
        product.riskFlag = FHE.sub(FHE.asEuint32(1), allCompliant);
        
        // Allow contract and owner to decrypt compliance results
        FHE.allowThis(product.isCompliant);
        FHE.allow(product.isCompliant, product.owner);
        FHE.allowThis(product.riskFlag);
        FHE.allow(product.riskFlag, product.owner);
        
        emit ComplianceChecked(productId);
    }

    /// @notice Calculate risk score for a product
    /// @param productId The product ID to calculate risk for
    /// @dev Normalized and bounded risk score in [0, 100].
    ///      Inputs typical ranges:
    ///        - cost: around 10,000
    ///        - supplierScore: 50-100
    ///        - riskParam: 0-50
    ///
    ///      Steps (all done on encrypted values):
    ///        - costPercent = min((cost * 100) / 10000, 100)
    ///        - supplierRiskPercent = min((100 - supplierScore) * 2, 100)  // maps [50,100] -> [100,0]
    ///        - riskParamPercent = min(riskParam * 2, 100)                 // maps [0,50] -> [0,100]
    ///        - riskScore = (w1*costPercent + w2*supplierRiskPercent + w3*riskParamPercent) / 100
    ///        - clamp riskScore to 100
    function calculateRiskScore(uint256 productId) external {
        require(_thresholdsInitialized, "Thresholds not initialized");
        ProductInfo storage product = products[productId];
        require(product.owner != address(0), "Product does not exist");
        
        // Constants
        euint32 hundred = FHE.asEuint32(100);

        // costPercent = min((cost * 100) / 10000, 100)
        euint32 costTimes100 = FHE.mul(product.cost, uint32(100));
        euint32 costPercent = FHE.div(costTimes100, uint32(10000));
        costPercent = FHE.min(costPercent, uint32(100));

        // supplierRiskPercent = min((100 - supplierScore) * 2, 100)
        euint32 supplierDiff = FHE.sub(uint32(100), product.supplierScore);
        supplierDiff = FHE.min(supplierDiff, uint32(50)); // guard if out-of-range
        euint32 supplierRiskPercent = FHE.mul(supplierDiff, uint32(2));
        supplierRiskPercent = FHE.min(supplierRiskPercent, uint32(100));

        // riskParamPercent = min(riskParam * 2, 100)
        euint32 riskParamPercent = FHE.mul(product.riskParam, uint32(2));
        riskParamPercent = FHE.min(riskParamPercent, uint32(100));

        // Weighted sum: (w1*cost + w2*supplier + w3*riskParam) / 100
        euint32 t1 = FHE.mul(_weight1, costPercent);
        euint32 t2 = FHE.mul(_weight2, supplierRiskPercent);
        euint32 t3 = FHE.mul(_weight3, riskParamPercent);
        euint32 weightedSum = FHE.add(FHE.add(t1, t2), t3);
        euint32 riskScore = FHE.div(weightedSum, uint32(100));

        // Clamp to 100 just in case weights sum > 100
        riskScore = FHE.min(riskScore, uint32(100));
        
        product.riskScore = riskScore;
        
        // Allow contract and owner to decrypt risk score
        FHE.allowThis(product.riskScore);
        FHE.allow(product.riskScore, product.owner);
        
        emit RiskCalculated(productId);
    }

    /// @notice Get encrypted threshold and weight handles for viewing/decryption off-chain
    /// @dev Returns encrypted handles (bytes32) for each threshold/weight
    function getThresholdHandles() external view returns (
        euint32 maxCostThreshold,
        euint32 minSupplierScoreThreshold,
        euint32 maxRiskParamThreshold,
        euint32 weight1,
        euint32 weight2,
        euint32 weight3
    ) {
        return (
            _maxCostThreshold,
            _minSupplierScoreThreshold,
            _maxRiskParamThreshold,
            _weight1,
            _weight2,
            _weight3
        );
    }

    /// @notice Allow a user to decrypt all thresholds and weights
    /// @dev This grants decryption permission for the provided address for each encrypted value
    ///      This function is intentionally permissionless to make thresholds readable by anyone.
    function allowThresholdDecryptionFor(address user) external {
        FHE.allow(_maxCostThreshold, user);
        FHE.allow(_minSupplierScoreThreshold, user);
        FHE.allow(_maxRiskParamThreshold, user);
        FHE.allow(_weight1, user);
        FHE.allow(_weight2, user);
        FHE.allow(_weight3, user);
    }

    /// @notice Allow a user to decrypt compliance status, risk flag, and risk score for a product
    /// @dev This grants decryption permission for the provided address for compliance-related fields
    ///      This function is intentionally permissionless to make these fields readable by anyone.
    /// @param productId The product ID
    /// @param user The address to grant decryption permission to
    function allowProductComplianceDecryptionFor(uint256 productId, address user) external {
        ProductInfo storage product = products[productId];
        require(product.owner != address(0), "Product does not exist");
        
        FHE.allow(product.isCompliant, user);
        FHE.allow(product.riskFlag, user);
        FHE.allow(product.riskScore, user);
    }

    /// @notice Get encrypted product information
    /// @param productId The product ID
    /// @return batchNumber Encrypted batch number
    /// @return cost Encrypted cost
    /// @return supplierScore Encrypted supplier score
    /// @return riskParam Encrypted risk parameter
    /// @return isCompliant Encrypted compliance flag
    /// @return riskFlag Encrypted risk flag
    /// @return riskScore Encrypted risk score
    /// @return productOwner Product owner address
    /// @return timestamp Registration timestamp
    function getProductInfo(uint256 productId) external view returns (
        euint32 batchNumber,
        euint32 cost,
        euint32 supplierScore,
        euint32 riskParam,
        euint32 isCompliant,
        euint32 riskFlag,
        euint32 riskScore,
        address productOwner,
        uint256 timestamp
    ) {
        ProductInfo storage product = products[productId];
        require(product.owner != address(0), "Product does not exist");
        
        return (
            product.batchNumber,
            product.cost,
            product.supplierScore,
            product.riskParam,
            product.isCompliant,
            product.riskFlag,
            product.riskScore,
            product.owner,
            product.timestamp
        );
    }

    /// @notice Get the total number of products
    /// @return The total number of registered products
    function getProductCount() external view returns (uint256) {
        return productCounter;
    }
}

