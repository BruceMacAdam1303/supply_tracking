
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const SupplyChainTrackingABI = {
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        }
      ],
      "name": "ComplianceChecked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ProductRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        }
      ],
      "name": "RiskCalculated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "actor",
          "type": "address"
        }
      ],
      "name": "ThresholdsAdjusted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "maxCostThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "minSupplierScoreThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "maxRiskParamThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "weight1",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "weight2",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "weight3",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "adjustThresholds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "allowProductComplianceDecryptionFor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "allowThresholdDecryptionFor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        }
      ],
      "name": "calculateRiskScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        }
      ],
      "name": "checkCompliance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProductCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        }
      ],
      "name": "getProductInfo",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "batchNumber",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "cost",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "supplierScore",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskParam",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "isCompliant",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskFlag",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskScore",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "productOwner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getThresholdHandles",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "maxCostThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "minSupplierScoreThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "maxRiskParamThreshold",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "weight1",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "weight2",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "weight3",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "productCounter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "products",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "batchNumber",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "cost",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "supplierScore",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskParam",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "isCompliant",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskFlag",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "riskScore",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "batchNumber",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "cost",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "supplierScore",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "riskParam",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "registerProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "thresholdsInitialized",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

