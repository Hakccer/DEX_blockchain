const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('SwapperSting', () => {
        let swapperSting;
        let aggrContract;
        let deployer

        beforeEach(async()=>{
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            swapperSting = await ethers.getContract(
                "SwapperSting",
                deployer
            );
            aggrContract = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            )
        })

        describe('constructor', () => {
            it("Constructor test", async()=>{
                let getPriceToken = await swapperSting.getTokensPrice(
                    "NISH"
                );
                getPriceToken = ethers.formatEther(getPriceToken);
                console.log(getPriceToken);
                assert.equal(getPriceToken, "0.0001");
            })
        })

        describe('testing aggregator', ()=>{
            it("price check test", async()=>{
                let priceInETH = ethers.formatEther(
                    await swapperSting.getTokensPrice(
                        "NISH"
                    )
                );
                let values = await swapperSting.getUSDPrice();
                // getting the exact price
                console.log(`${parseFloat(values[0])} ${ parseFloat(values[1])}`);
                let usdValue = parseFloat(values[0]) / (10 ** parseFloat(values[1]))
                let exactUSDofETHS = parseInt(priceInETH) * usdValue;
                console.log(exactUSDofETHS);
            })
        })
    })