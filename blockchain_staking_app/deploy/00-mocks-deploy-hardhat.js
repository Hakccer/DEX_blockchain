const hre = require("hardhat");
const { developmentChains, decimals, initialValue } = require("../helper-hardhat.config");

module.exports = async()=>{
    const {deploy, log} = hre.deployments;
    const {deployer} = await hre.getNamedAccounts();

    // deploying the mocks if the network is localhost or hardhat
    if(developmentChains.includes(hre.network.name)){
        // development chain detected deploying the mocks
        const mockDeploy_tx = await deploy("MockV3Aggregator",{
            from:deployer,
            log:true,
            args:[
                decimals,
                initialValue
            ]
        })
        console.log("Mocks Deployed Successfully");
    }
}

module.exports.tags = [
    "all",
    "mocks"
]