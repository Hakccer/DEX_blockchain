const networkConfig = {
    11155111:{
        eth_to_usd_addr: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    }
}

const initialValue = 184300000000
const decimals = 8

const developmentChains = [
    "hardhat",
    "localhost"
]

module.exports = {
    networkConfig,
    initialValue,
    decimals,
    developmentChains
}