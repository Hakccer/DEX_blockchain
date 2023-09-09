// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Token is ERC20{
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name,symbol) {
        _mint(msg.sender, 1000000e18);
    }
}

contract SwapperSting{
    string[] public tokenNames = [
        "NISH",
        "AUQ"
    ];
    mapping (string => Token) internal tokens;
    mapping (string => uint256) internal tokenPrices;

    address public immutable owner;

    address public immutable eth_usd;

    constructor(
        uint256[] memory c_tokenPrices,
        address c_eth_usd
    ) {
        // adding all the tokens here
        uint32 token_index = 0;
        while (token_index < tokenNames.length){
            tokens[tokenNames[token_index]] = new Token(
                tokenNames[token_index],
                tokenNames[token_index]
            );
            tokenPrices[tokenNames[token_index]] = c_tokenPrices[token_index];
            token_index++;
        }
        owner = msg.sender;
        eth_usd = c_eth_usd;
    }

    modifier minimumValue {
        require(msg.value > 0, "Value must be greatere than 0");
        _;
    }

    function getTokensPrice(string memory token_name) public view returns(uint256) {
        return tokenPrices[token_name];
    }
    
    function getTokenAddr(string memory token_name) public view returns(address){
        return address(tokens[token_name]);
    }

    function getUSDPrice() public view returns(uint256, uint8) {
        AggregatorV3Interface aggr_usd = AggregatorV3Interface(eth_usd);
        int256 usd_value;
        uint8 decimals;
        (,usd_value,,,) = aggr_usd.latestRoundData();
        decimals = aggr_usd.decimals();
        return (uint256(usd_value), decimals);
    }

    function swapETHtoToken(string memory tokenName) minimumValue public payable returns(uint256){
        uint256 exactTokensAmount = (msg.value / tokenPrices[tokenName]) * 1e18;
        // now sending this tokens to the msg.sender;
        require(tokens[tokenName].transfer(msg.sender, exactTokensAmount));
        return exactTokensAmount;
    }

    function swapTokentoETH(string memory tokenName, uint256 numOfCoins) public returns(uint256){
        uint256 exactCoins = numOfCoins;
        uint256 ethValueOfCoin = exactCoins * tokenPrices[tokenName];
        require(address(this).balance >= ethValueOfCoin,"Dex is low on balance");
        payable(msg.sender).transfer(ethValueOfCoin);
        uint256 coinsToTakeBack = exactCoins * 1e18;
        // now first approving the the amount of tokens user want to give back
        require(tokens[tokenName].transferFrom(msg.sender, address(this), coinsToTakeBack));
        return ethValueOfCoin;
    }

    function swapTokenToToken(string memory tokenAName, string memory tokenBName, uint256 tokenACount) public{
        uint256 exactCoinstokenA = tokenACount;
        uint256 ethExactCoinsAval = exactCoinstokenA * tokenPrices[tokenAName];
        // now sending the values to our contract from the Token-A
        uint256 tokensToSent = exactCoinstokenA * 1e18;
        require(tokens[tokenAName].transferFrom(msg.sender, address(this), tokensToSent));
        uint256 ethExactTokenBCoins = (ethExactCoinsAval / tokenPrices[tokenBName]) * 1e18;   
        // now sending the values from our contract to the Sender Token-B
        require(tokens[tokenBName].transfer(msg.sender, ethExactTokenBCoins));
    }

    function getCoinsCount(string memory token_name) public view returns(uint256){
        return tokenPrices[token_name];
    }

    function getTokenNames() public view returns(string[] memory){
        return tokenNames;
    } 
}