import logo from './logo.svg';
import './App.css';
import { useWeb3React } from '@web3-react/core';
import coin from './images/coins.png'
import exchange_icon from "./images/two_arrows.png"
import dollar from "./images/dollar.png"
import eth_coin from "./images/eth_coin.png"
import { useEffect, useRef, useState } from 'react';
import { InjectedConnector } from "@web3-react/injected-connector"
import { SUPPORTED_CHAINS, addrs, coinNames, getNetworkName } from './utils/constants';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import DexLow from './abis/DexLow';
import { ethers } from 'ethers';
import { DexAddr } from './utils/constants';
import CoinModal from "react-modal"
import Token from './abis/Token';
import BigInt from "big-integer"

const injected = new InjectedConnector({
  supportedChainIds: [...SUPPORTED_CHAINS]
})

function App() {
  const [networkName, setNetworkName] = useState("Not Connected")
  const { account, library: provider, deactivate, activate, error, active, chainId } = useWeb3React()
  const getAddress = (addr = "0x000000000000000000000000000000") => {
    return `${addr.slice(0, 5)}...${addr.slice(addr.length - 6, addr.length)}`
  }
  const [getBlockNumber, setBlockNumber] = useState(0);
  const [exchangeRateOne, setExchangeRateOne] = useState(0);
  const [exchangeRateTwo, setExchangeRateTwo] = useState(0);
  const [exchangeValue, setExchangeValue] = useState(0);
  const [outputValue, setOutputValue] = useState(0);
  const [dexContract, setDexContract] = useState(undefined);

  const [selectCoinModal, setSelectCoinModal] = useState(false)

  const [exchangeCoin, setExchangeCoin] = useState(coinNames[0])
  const [outputCoin, setOutputCoin] = useState(coinNames[1])

  const [modalEventEmitter, setModalEventEmitter] = useState(undefined);

  const inputRefOne = useRef()
  const inputRefTwo = useRef()

  const getSigner = async () => {
    console.log(provider);
    return (await provider?.getSigner())
  }

  const decimalFiltering = (val) => {
    if (String(val).includes('.')) {
      let defo_val = String(val).split(".")
      defo_val[1] = defo_val[1].slice(0, 7);
      return defo_val.join(".");
    }
    return String(val);
  }

  const ethToUSD = async () => {
    if (!dexContract) return 0;
    // getting the required Details in USD
    let usd_data = await dexContract.getUSDPrice();
    let new_usd_data = []
    for (let i = 0; i < usd_data.length; i++) {
      new_usd_data[i] = parseInt(String(usd_data[i]));
    }
    new_usd_data = parseFloat(new_usd_data[0] / (10 ** new_usd_data[1]))
    return new_usd_data;
  }

  const getExchangeRate = async (usd_value) => {
    if (exchangeCoin == 'ETH') {
      return (parseFloat(exchangeValue) * parseFloat(usd_value));
    }
    else {
      let tempExchangeTokenPrice = await getTokenPrice(exchangeCoin);
      return (
        (parseFloat(tempExchangeTokenPrice) * parseFloat(exchangeValue)) * parseFloat(usd_value)
      )
    }
  }

  const settingOutputTwo = async () => {
    let tempouttokenPrice = await getTokenPrice(
      outputCoin
    );
    let tempExcTokenPrice = await getTokenPrice(
      exchangeCoin
    );
    if (outputCoin == "ETH") {
      let tempoutputValue = parseFloat(exchangeValue) * parseFloat(tempExcTokenPrice);
      console.log(tempoutputValue);
      return tempoutputValue
    }
    else {
      let totalEthValueofExchangeCoin
      if (exchangeCoin != "ETH") {
        totalEthValueofExchangeCoin = parseFloat(tempExcTokenPrice) * parseFloat(exchangeValue);
      }
      else {
        totalEthValueofExchangeCoin = parseFloat(exchangeValue)
      }
      let tempoutputValue = parseFloat(totalEthValueofExchangeCoin) / parseFloat(tempouttokenPrice)
      return tempoutputValue;
    }
  }

  const settingExchangeRateTwo = async (usd_value) => {
    let outputTokenPrice = await getTokenPrice(outputCoin);
    if (outputCoin == "ETH") {
      return (
        parseFloat(usd_value) *
        parseFloat(outputValue)
      )
    }
    else {
      return (
        (
          parseFloat(outputTokenPrice) *
          parseFloat(outputValue)
        ) *
        parseFloat(usd_value)
      )
    }
  }

  const getTokenPrice = async (token_name) => {
    if (!dexContract) return 0;
    // getting the Contract and calling the Function Below
    let tokenPrice = String(await dexContract.getCoinsCount(token_name.toString()));
    let the_temp_token_price = parseFloat(tokenPrice) / (10 ** 18);
    return the_temp_token_price;
  }

  const getContractInstance = async () => {
    if (!account) return 0;
    let myDex = new ethers.Contract(
      DexAddr,
      DexLow,
      (await getSigner())
    );
    setDexContract(myDex);
  }

  const setting = async()=>{
    let dek = await provider?.getBlockNumber()
    console.log(dek);
    setBlockNumber(dek)
  }
  const getTokenContactInstance = async (token_name) => {
    if (!account) return 0;
    console.log(addrs[token_name], token_name);
    return new ethers.Contract(
      addrs[`${token_name}`],
      Token,
      (await getSigner())
    );
  }

  const exchange = async (token_name_one, token_name_two) => {
    if (!dexContract) return 0;
    // else we will excahnge the amount here
    console.log(token_name_one);
    let token_one_price, token_two_price;
    let defo_value = {
      value: exchangeValue
    }
    let exchnaging_tx;
    if (exchangeCoin == "ETH") {
      // getting the token price here
      exchnaging_tx = await dexContract.swapETHtoToken(token_name_two, {
        value: ethers.parseEther(exchangeValue.toString())
      });
    }
    else if (outputCoin == "ETH") {
      // geting the token price here
      let tokenInstanceToApprove = await getTokenContactInstance(token_name_one);
      let approve_tx = await tokenInstanceToApprove.approve(
        DexAddr,
        ethers.parseEther(exchangeValue.toString())
      );
      exchnaging_tx = await dexContract.swapTokentoETH(token_name_one, exchangeValue);
    }
    else {
      // approving the amount of token_A_or_One
      let tokenInstancetoApprove = await getTokenContactInstance(token_name_one)
      let approve_tx = await tokenInstancetoApprove.approve(
        DexAddr,
        ethers.parseEther(exchangeValue.toString())
      );
      exchnaging_tx = await dexContract.swapTokenToToken(token_name_one, token_name_two, exchangeValue);
    }
  }

  const connect = async () => {
    if (account) {
      let temp_account = account;
      deactivate()
      toast.success(`Disconnect from ${getAddress(temp_account)}`)
      window.localStorage.removeItem('connected')
    }
    else {
      await toast.promise(
        activate(injected),
        {
          pending: "connecting to account",
          error: "not able to connect",
          success: `connected to selected account`
        }
      )
    }
  }

  const setInputValue = (e, valueToSet) => {
    e.target.value = valueToSet
  }

  useEffect(() => {
    // adding a event listner for the metamask connection
    (async () => {
      if (window.localStorage.getItem('connected')) {
        await activate(injected)
      }
    })()
    return ()=>{
      clearInterval(setInterval(async()=>{
        await setting()
      },5000))
    }
  }, [])

  useEffect(() => {
    if (account) {
      (async () => {
        await getContractInstance()
      })()
    }
  }, [account])

  useEffect(() => {
    if (dexContract) {
      (async () => {
        let usd_val = await ethToUSD()
        // now getting the exact USD value
        setExchangeRateOne(await getExchangeRate(usd_val))
        // now setting the value for the inputTwo
        let outputVal = decimalFiltering(await settingOutputTwo());
        inputRefTwo.current.value = (String(outputVal) == "0") ? `0 ${outputCoin}` : outputVal
        setOutputValue(outputVal)
      })()
    }
  }, [exchangeValue])

  useEffect(() => {
    if (dexContract) {
      (async () => {
        let usd_val = await ethToUSD()
        // now getting the exact USD value
        setExchangeRateTwo(await settingExchangeRateTwo(usd_val));
      })()
    }
  }, [outputValue])

  useEffect(() => {
    if (modalEventEmitter) {
      setSelectCoinModal(true)
    }
  }, [modalEventEmitter])

  return (
    <div className="App">
      <div style={{
        position:'fixed',
        bottom:'0',
        right:'0',
        display:'flex',
        flexDirection:'row',
        gap:'7px',
        alignItems:'center',
        margin:'10px'
      }}>
        <div>
          BN {getBlockNumber}
        </div>
        <div className='loader'></div>
      </div>
      <CoinModal
        isOpen={selectCoinModal}
        style={{
          overlay: {
            backgroundColor: 'rgba(0,0,0,0.8)'
          },
          content: {
            backgroundColor: 'black',
            borderBottom: '0px',
            borderRight: '0px',
            borderTop: '3px solid aqua',
            borderLeft: '3px solid aqua',
            width: '300px',
            height: '300px',
            marginLeft: 'calc(50% - 210px)',
            marginTop: '120px',
            color: 'black',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: 'blueviolet 5px 5px, blueviolet 10px 10px, blueviolet 15px 15px, blueviolet 20px 20px, blueviolet 25px 25px'
          }
        }}
        portalClassName='modal'
      >
        <div style={{
          borderBottom: '1px solid white',
          paddingBottom: '10px'
        }}>
          Select {(modalEventEmitter == 'exchanger') ? "Exchangeble" : "Output"} Coins
        </div>
        <div style={{
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {
            coinNames.map((v, i) => {
              return <div className='coin_ele' style={{
                borderRadius: '4px',
                color: 'white',
                padding: '10px'
              }} onClick={() => {
                setModalEventEmitter(undefined)
                setSelectCoinModal(false)
                if (modalEventEmitter == "exchanger") {
                  if (outputCoin != v) {
                    setExchangeCoin(v)
                    toast.success(`${v} Coin selected as ${modalEventEmitter}`)
                  }
                  else {
                    toast.error(`${v} Coin already selected as outputer`)
                  }
                }
                else {
                  if (exchangeCoin != v) {
                    setOutputCoin(v)
                    toast.success(`${v} Coin selected as ${modalEventEmitter}`)
                  }
                  else {
                    toast.error(`${v} Coin already selected as exchanger`)
                  }
                }
              }} >{v}</div>
            })
          }
        </div>
      </CoinModal>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        style={{
          color: 'black'
        }}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <header className="App-header" style={{
        padding: '15px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          color: 'black',
          gap: '50px',
          alignItems: 'center',
          fontSize: '15px'
        }}>
          <div className='cursor_head'>
            Swapper<span style={{
              color: 'black'
            }}>Sting</span>
          </div>
          <div className='cursor'>
            Home
          </div>
          <div className='cursor'>
            About
          </div>
          <div className='cursor'>
            Who we are
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button style={{
            color: 'white',
            outline: 'none',
            border: 'none',
            backgroundColor: 'blueviolet',
            height: '40px',
            width: '100px',
            fontFamily: 'Poppins',
            borderRadius: '10px'
          }} onClick={async () => { await connect() }}>
            {(!account) ? "connect" : "Disconnect"}
          </button>
          {account && <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '10px'
          }}>
            <div style={{
              color: 'black',
              border: '1px solid blueviolet',
              padding: '5px',
              paddingLeft: '10px',
              paddingRight: '10px',
              borderRadius: '10px'
            }}>
              {getNetworkName[chainId]}
            </div>
            <div style={{
              color: 'black',
              border: '1px solid blueviolet',
              padding: '5px',
              paddingLeft: '10px',
              paddingRight: '10px',
              borderRadius: '10px'
            }}>
              <code style={{
                fontWeight:'600'
              }}>{getAddress(account)}</code>
            </div>
          </div>}
        </div>
      </header>
      <div style={{
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        marginTop: '110px'
      }}>
        {(active) ? <div style={{
          width: '400px',
          borderRadius: '15px',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor:'blueviolet',
          boxShadow: "rgba(240, 46, 170, 0.4) 5px 5px, rgba(240, 46, 170, 0.3) 10px 10px, rgba(240, 46, 170, 0.2) 15px 15px, rgba(240, 46, 170, 0.1) 20px 20px, rgba(240, 46, 170, 0.05) 25px 25px"
        }}>
          <div style={{
            color: 'white',
            fontSize: '20px'
          }}>
            Welcome to Dex,
          </div>
          <div className='exchange_inp'>
            <div style={{
              width: '100%'
            }}>
              <input ref={inputRefOne} type='number' placeholder={`0.00 ${exchangeCoin}`} onInput={(e) => {
                let init_val = e.target.value;
                if (init_val == "") {
                  init_val = 0
                }
                setExchangeValue(parseFloat(init_val))
              }}></input>
            </div>
            <div className='coin_selector' onClick={() => {
              setModalEventEmitter("exchanger")
            }}>
              <img src={dollar} className='selector' style={{
                width: '25px'
              }}></img>
            </div>
          </div>
          <div style={{
            color: 'white'
          }}>
            {exchangeValue} {exchangeCoin} = {exchangeRateOne}$
          </div>
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '10px',
            marginBottom: '10px'
          }}>
            <img src={exchange_icon} style={{
              rotate: '90deg',
              width: '40px'
            }}></img>
          </div>
          <div className='exchange_inp'>
            <div style={{
              width: '100%'
            }}>
              <input ref={inputRefTwo} type='number' disabled placeholder={`0.00 ${outputCoin}`} onInput={(e) => {
                if (e.target.value.includes("-")) {
                  setOutputValue(parseFloat(0))
                  return 0;
                }
                let init_val = e.target.value;
                if (init_val == "") {
                  init_val = 0;
                }
                setOutputValue(parseFloat(init_val))
              }}></input>
            </div>
            <div className='coin_selector' onClick={() => {
              setModalEventEmitter("outputer")
            }}>
              <img src={dollar} className='selector' style={{
                width: '25px'
              }}></img>
            </div>
          </div>
          <div style={{
            color: 'white'
          }}>
            {outputValue} {outputCoin} = {exchangeRateTwo}$
          </div>
          <div>
            <button style={{
              width: '100%',
              height: '45px',
              backgroundColor: 'white',
              outline: 'none',
              border: 'none',
              fontFamily: 'Poppins',
              borderRadius: '16px',
              color:'blueviolet',
              fontSize:'16px',
              textTransform:'uppercase',
              fontWeight:'600'
            }} onClick={async () => {
              await exchange(
                exchangeCoin,
                outputCoin
              );
            }}>
              Exchange
            </button>
          </div>
        </div> : <div style={{
          width: '400px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'black'
        }}>
          <div className='not_connect_div'>
            <div style={{
              textAlign: 'center'
            }}>
              <img className='metamask_account' src={eth_coin} ></img>
            </div>
            <div style={{
              textAlign: 'center',
              fontWeight: '600',
              textShadow: '.1px .1px 80px black'
            }}>
              {(error) ? error.message : "first connect to account"}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default App;
