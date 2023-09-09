const hre = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat.config");
const { verify } = require("../utils/verify");

module.exports = async () => {
    const { deploy, log } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    log("checking if the network is development one....")
    // now deploying the Contract here
    let aggrAddr;
    let pricesOfCoins = [
        hre.ethers.parseEther("0.0001"),
        hre.ethers.parseEther("0.00001")
    ]
    if(developmentChains.includes(hre.network.name)){
        // getting the aggregator contract to ourselves first
        log("Development Chain Detected");
        const AggrContract = await hre.ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
        aggrAddr = await AggrContract.getAddress()
    }
    else{
        aggrAddr = networkConfig[hre.network.config.chainId][eth_to_usd_addr];
    }

    // now deploying the DEX here finally
    let args = [
        pricesOfCoins,
        aggrAddr
    ]
    const DEX = await deploy(
        "SwapperSting",{
            from:deployer,
            log:true,
            args:args
        }
    )
    // now getting all the Deplyed ERC20 tokens and getting the address
    let DexContract = await hre.ethers.getContract("SwapperSting", deployer);
    let token_names = await DexContract.getTokenNames();
    for (let i = 0; i < token_names.length; i++) {
        let temp_token_addr = await DexContract.getTokenAddr(
            token_names[i]
        );
        console.log(`${token_names[i]} -> ${temp_token_addr}`);
    }
    
    if(!developmentChains.includes(hre.network.name)){
        await verify(
            DEX.address,
            args
        );
    }
}

module.exports.tags = [
    "all"
]