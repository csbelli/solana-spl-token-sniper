const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config = require('../utils/config.js');
const util_1 = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');
const { info } = require('console');
const derivePoolKeys = require('./derivePoolKeys.js');
const logger = require('../logger.js');
const swap = require('./swap2.js');

const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const connection = config.connection;

//tryCode("3MsMCSEoeuJrrnwAkfepNeC5AsrFkps4zKKFAQSRmKtY");
//decimalTest("99p7VwKhHsKEmCmEDQFfED27p6FotRJTPNdngyKbqXdo");
//getSolanaPrice();

//testGetBalances("5tPaEp6uBR7frDav1aTwwK8huLy37wiGaKejQvpqkRWu3eTrQvYr2qG9rhWZCtupcgqGc7EHN9rNFu5kkhsYL7so", "A4AAdnjnpb24TYCQ21T4onp6hFU8BYXinM3EdHZCG46R", config.ownerAddress);
//getTx("5tPaEp6uBR7frDav1aTwwK8huLy37wiGaKejQvpqkRWu3eTrQvYr2qG9rhWZCtupcgqGc7EHN9rNFu5kkhsYL7so");
//testSelling("3cCTCRAZQgafj96iLWPtBYEzr5HKdZzzJEW8ThQAyTHc");

//getLPData("HtsX2mcApcCRAY1e9wREhtPvmXjWxb1hRt6CDzzmQqH3"); //marketId
manualSell("51v5JvrJToKSUtqht6br9NMSXqWwDjJ7Sm7gTtt4fcUA", "61tkKL1XAMqWfrHjx55SLeqF6jmuFcKBSAm1y9VA1tRBQ329xab5MAeUvZY3qUcn4YTLLQbExSFJRXUDG12T33tf"); //marketId, Tx

async function manualSell(marketId, tx){
    const keyData = await connection.getAccountInfo(new web3.PublicKey(marketId));
    if (keyData !== null) {
        logger.info("Market Key Data Retrieved");
    } else {
        logger.info("Market Key Data Retrieval error");
    }
    const marketDeco = await getDecodedData(keyData);
    if (marketDeco !== null) {
        logger.info("Market decoded Data Retrieved");
    } else {
        logger.info("Market decoded Data Retrieval error");
    }
    const signature = "fake";
    
    const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
    if (poolKeys !== null) {
        logger.info("Pool Keys Retrieved");
    } else {
        logger.info("Pool Keys Retrieval error");
    }

    const tokenBalance = await getBalances(tx, poolKeys.baseMint.toString(), config.ownerAddress);
    if (tokenBalance !== null){
        logger.info("Token Balance Retrieved");
    } else {
        logger.info("Token Balance Retrieval Error");
    }

    // call swap
    logger.info("Time to sell Meme");
    swap.swapMemeForSol(poolKeys, signature, tokenBalance);
}

async function testSelling(marketId){
    const keyData = await connection.getAccountInfo(new web3.PublicKey(marketId));
    if (keyData !== null) {
        logger.info("Market Key Data Retrieved");
    } else {
        logger.info("Market Key Data Retrieval error");
    }
    const marketDeco = await getDecodedData(keyData);
    if (marketDeco !== null) {
        logger.info("Market decoded Data Retrieved");
    } else {
        logger.info("Market decoded Data Retrieval error");
    }
    const signature = "fake";
    const tx = "5tPaEp6uBR7frDav1aTwwK8huLy37wiGaKejQvpqkRWu3eTrQvYr2qG9rhWZCtupcgqGc7EHN9rNFu5kkhsYL7so";

    const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
    if (poolKeys !== null) {
        logger.info("Pool Keys Retrieved");
    } else {
        logger.info("Pool Keys Retrieval error");
    }

    monitorTokenSell(tx, poolKeys, config.ownerAddress, signature);
}

async function tryCode(marketId) {
    const keyData = await connection.getAccountInfo(new web3.PublicKey(marketId));
    console.log("MarketID Key Data: ", keyData);
    
    const marketDeco = await getDecodedData(keyData);
    console.log("Key Data Decoded: ", marketDeco);

    console.log("marketDeco.baseMint: ", marketDeco.baseMint.toString());
    //if(marketDeco.baseMint.toString() === "So11111111111111111111111111111111111111112"){
    //    console.log("switch base and quote");
    //} else {
    //    console.log("no switch needed");
    //}
    

    let tokenAddress = new web3.PublicKey(marketDeco.baseMint);
    //Some coins have the base and quote reversed.
    if(tokenAddress.toString() === "So11111111111111111111111111111111111111112"){
        tokenAddress = marketDeco.quoteMint;
    }

    console.log("Token Address: ", tokenAddress);

    // tokenInfo.value.data.parsed includes: info, type (ex. mint)
    // tokenInfo.value.data.parsed.info includes: decimals, freezeAuthority, isInitialized, mintAuthority, supply
    //const tokenInfo = await connection.getParsedAccountInfo(new web3.PublicKey(marketDeco.baseMint));
    //console.log("tokenInfo decimals: ", tokenInfo.value.data.parsed.info.decimals);
    //console.log("tokenInfo supply: ", tokenInfo.value.data.parsed.info.supply);

    //const getTokenSupply = await connection.getTokenSupply(new web3.PublicKey(marketDeco.baseMint));
    //console.log("getTokenSupply supply: ", getTokenSupply);
    
    //const largestAccounts = await connection.getTokenLargestAccounts(new web3.PublicKey(marketDeco.baseMint));
    //console.log("largest accounts: ", largestAccounts);
}

async function testGetBalances(tx, tokenAddress, ownerAddress){
    const tokenBalance = await getBalances(tx, tokenAddress, ownerAddress);
    const buyPrice = (config.amtBuySol / tokenBalance);
    logger.info({"Meme Buy Price" : buyPrice}, "Meme Buy Price");
    logger.info({"Meme Buy Qty" : tokenBalance}, "Meme Buy Qty");
    //logger.info({"Token Balance":tokenBalance}, "Token Balance");
}

async function monitorToken(buyPrice, poolKeys, tokenBalance, signature){
    let count = 0;
    const maxIntervals = 9;

    let interval = setInterval(async () => {
        if (count >= maxIntervals) {
            clearInterval(interval);
            
            // call swap
            logger.info("Time to sell Meme");
            swap.swapMemeForSol(poolKeys, signature, tokenBalance);

            return;
        }
        logger.info({"Monitor Token Interval Count" : count}, "Monitor Token Interval Count");
        const currentPrice = await getTokenPriceInSol(poolKeys.baseVault.toString(), poolKeys.quoteVault.toString());
        if (currentPrice !== null){
            logger.info("Current Price Retrieved");
        } else {
            logger.info("Current Price Retrieval Error");
        }
        logger.info({"Buy Price" : buyPrice, "Current Price" : currentPrice}, "Buy and Current Price Details");
        const percentIncrease = ((buyPrice - currentPrice) / buyPrice) * 100;
        logger.info({"Percent Chagne" : percentIncrease}, "Percent Change");
        
        count++;
    }, 5000)
}

async function getTokenPriceInSol(baseVault, quoteVault){
    const baseVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(baseVault));
    const quoteVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(quoteVault));
    const baseVaultAccountAmount = baseVaultAccount.value.uiAmount;
    const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount;
    return (quoteVaultAccountAmount / baseVaultAccountAmount);
}

async function soldMemeTokenResult(tx, poolKeys, ownerAddress){
    // Use tx to determine SOL received from selling Meme coin
    const tokenBalance = await getBalances(tx, poolKeys.quoteMint.toString(), ownerAddress);
    logger.info("Sold Meme for SOL");
    //console.log("Sol used to buy Meme" + buyAmtSol + " Sol P/L: WIP");
    logger.info({"Current SOL Balance" : tokenBalance}, "Current SOL Balance");
}

async function monitorTokenSell(tx, poolKeys, ownerAddress, signature){
    const tokenBalance = await getBalances(tx, poolKeys.baseMint.toString(), ownerAddress);
    if (tokenBalance !== null){
        logger.info("Token Balance Retrieved");
    } else {
        logger.info("Token Balance Retrieval Error");
    }
    
    const buyPrice = (config.amtBuySol / tokenBalance);
    const solPriceUSD = util_1.getSolanaPriceInUSDC();
    if (solPriceUSD !== null){
        logger.info("SOL Price Retrieved");
    } else {
        logger.info("SOL Price Retrieval Error");
    }

    logger.info({"Meme Buy Price" : buyPrice}, "Meme Buy Price");
    logger.info({"Meme Buy Qty" : tokenBalance}, "Meme Buy Qty");
    //Console.log("Buy: ")

    monitorToken(buyPrice, poolKeys, tokenBalance, signature);
}

async function getTx(tx){
    /*return await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    })*/

    const transaction = await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    })

    /*const transaction = await connection.getParsedTransaction(
        tx,
        { maxSupportedTransactionVersion: 0 },
      );*/

    //console.log("TX: ", transaction);
    return transaction;
}

async function getBalances(tx, tokenAddress, ownerAddress){
    logger.info("Start get balances");
    let validTx = await getTx(tx);

    if(validTx !== null){
        //logger.info("validTx not NULL");
        for(const account of validTx.meta.postTokenBalances){
            if(account.mint === tokenAddress && account.owner === ownerAddress){
                return account.uiTokenAmount.uiAmount;
            }
        }
    } else {
        logger.info("validTx still NULL");
        return 0;
    }

    /*logger.info("ValidTx before while");
    while(validTx === null){
        logger.info("validTx inside while 1");
        validTx = await getTx(tx);
        logger.info("validTx inside while 2");
        if(validTx !== null){
            logger.info("validTx not NULL");
            for(const account of validTx.meta.postTokenBalances){
                if(account.mint === tokenAddress && account.owner === ownerAddress){
                    return account.uiTokenAmount.uiAmount;
                }
            }
        }
    }*/
}

async function getSolanaPrice(){
    const accountInfo = await connection.getAccountInfo(new web3.PublicKey("8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj"));

    //if (accountInfo === null) throw Error(' get pool info error ')

    const poolData = raydium_sdk_1.PoolInfoLayout.decode(accountInfo.data);

    logger.info({"Current SOL Price" : raydium_sdk_1.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2)});
}

async function getLPData(marketId){
    const keyData = await connection.getAccountInfo(new web3.PublicKey(marketId));
    const marketDeco = await getDecodedData(keyData);
    let lpDecoded = null;

    const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
    logger.info({"Pool Keys:":[poolKeys]}, "Pool Keys");

    //const data = await connection
    //    .getAccountInfo(new web3.PublicKey(poolKeys.id))
    //    .then((info) => raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data));

    const info = await connection.getAccountInfo(new web3.PublicKey(poolKeys.id));

    if (info !== null){
        lpDecoded = await raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
    } else {
        logger.info("LP Info is NULL");
    }
    
    if (lpDecoded !== null){
        logger.info({"Pool Open Time" : new Date(Number(lpDecoded.poolOpenTime.toString() * 1000))}, "Pool Open Time");
        logger.info({"Decoded LP Data" : [lpDecoded]}, "Decoded LP Data");
        logger.info({"maxOrder" : lpDecoded.maxOrder.toString()}, "Max LP Order");
        logger.info({"minSize" : lpDecoded.minSize.toString()}, "Min LP Size");

        const lpMintAccInfo = await connection.getParsedAccountInfo(new web3.PublicKey(lpDecoded.lpMint));
        const mintInfo = lpMintAccInfo?.value?.data?.parsed?.info;

        logger.info({"mintInfo" : [mintInfo]}, "Mint Info");
    }
}

async function decimalTest(tokenAddr) {
    const tokenInfo = await connection.getParsedAccountInfo(new web3.PublicKey(tokenAddr));
    console.log("tokenInfo decimals: ", tokenInfo.value.data.parsed.info.decimals);
    console.log("tokenInfo supply: ", tokenInfo.value.data.parsed.info.supply);

    const getTokenSupply = await connection.getTokenSupply(new web3.PublicKey(tokenAddr));
    console.log("getTokenSupply supply: ", getTokenSupply);

    if(getTokenSupply.value.uiAmount <= 100000000){
        console.log("Supply 100M or less");
    } else {
        console.log("Supply is > 100M");
    }
}

/*
    Returned values:
    tokenInfo decimals:  6
    tokenInfo supply:  8629947067281537

    const getTokenSupply = await connection.getTokenSupply(new web3.PublicKey(marketDeco.baseMint));
    getTokenSupply supply:  {
        context: { apiVersion: '1.17.33', slot: 266918017 },
        value: {
            amount: '8629947067281537',
            decimals: 6,
            uiAmount: 8629947067.281536,
            uiAmountString: '8629947067.281537'
    }

    const largestAccounts = await connection.getTokenLargestAccounts(new web3.PublicKey(marketDeco.baseMint));
    Largest Accounts returns top 20 accounts
    largest accounts:  {
        context: { apiVersion: '1.17.33', slot: 266918017 },
        value: [
            {
            address: [PublicKey [PublicKey(BpV6ZG8FKZK1mXqdPqQzc5VfgR79RmzNoRVHnknenhpS)]],
            amount: '8481491592388122',
            decimals: 6,
            uiAmount: 8481491592.388122,
            uiAmountString: '8481491592.388122'
            },
            {
            address: [PublicKey [PublicKey(EM4zwcFsoUZXDacnEYi9TwvEetHkotV4gt51VZqpBPMm)]],
            amount: '53988851523235',
            decimals: 6,
            uiAmount: 53988851.523235,
            uiAmountString: '53988851.523235'
            },
            .....
        ]
    }
*/

//const test = util_1.checkMintAuthorityRevoked("98LVCpvLyLVW7YU179fECNFWibt1RrqiKLPD2FjmdArb");
//console.log(test);

//console.log(util_1.getSolanaPriceInUSDC(connection));

/*async function checkTokenAccountHolders(tokenAddress) {
    const tokenInfo = await connection.getTokenLargestAccounts(new web3.PublicKey(tokenAddress));
    
    //verify no account, other than Raydium, hold more than 15% of the total supply
    
    return tokenInfo;
}*/

async function getDecodedData(marketInfo){
    return await Market.getLayout(openbookProgramId).decode(marketInfo.data);
}