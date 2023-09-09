const {run} = require("hardhat")

const verify = async(address, contractArguments)=>{
    // verifying the contract
    console.log("Verifying contract with addr ->",address);
    try{
        await run("verify:verify",{
            address:address,
            args:contractArguments
        });
    }
    catch(e){
        if (String(e.messages).toLowerCase().includes("already")){
            console.log("Contract already verified...");
        }
        else{
            console.log(`Error -> ${e.message}`);
        }
    }
    finally{
        console.log("Verification process finished successfully...");
    }
}

module.exports = {
    verify
}
