require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SEPOLIA_CHAIN_ID = process.env.SEPOLIA_CHAINID;
const ETHERSCAN_API_KEY  = process.env.ETHERSCAN_API_KEY;


module.exports = {
  solidity:{
    compilers:[
      {version:"0.8.20"},
      {version:"0.6.6"}
    ]
  },
  defaultNetwork: "hardhat",
  network:{
    sepolia:{
      chainId:11155111,
      url: SEPOLIA_RPC_URL,
      accounts:[
        SEPOLIA_PRIVATE_KEY
      ]
    }
  },
  etherscan:{
    apiKey:ETHERSCAN_API_KEY
  },
  namedAccounts:{
    deployer:{
      default:0,
      11155111:0
    }
  }
};
