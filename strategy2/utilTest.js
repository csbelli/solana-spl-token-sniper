const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config = require('../utils/config.js');
const util_1 = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');
const { info } = require('console');
const derivePoolKeys = require('./derivePoolKeys.js');
const logger = require('../logger.js');
const swap = require('./swap2.js');
//const { GetProgramAccountsFilter } = require("@solana/web3.js");

const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const connection = config.connection;

//marketId, Tx, memeTokenAddr
manualSell("", "", ""); 

//testTokenPriceInSol("52bscamMwyqkNeqa2L3TR55bNrFL3y8wP4ussAuTpump", config.solToken);



async function testTokenPriceInSol(memeTokenAddr, solToken){
    const price = await getTokenPriceInSol(memeTokenAddr, solToken);
    logger.info({"Token Price in Sol":price}, "Token price in SOL");
}

async function getTokenPriceInSol(memeTokenAddr, solToken){
    const baseVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(memeTokenAddr));
    const quoteVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(solToken));
    const baseVaultAccountAmount = baseVaultAccount.value.uiAmount;
    const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount;
    return (quoteVaultAccountAmount / baseVaultAccountAmount);
}

async function getMemeTokenBalance(memeTokenAddr){
    const tokenBalance = await util_1.getWalletMemeTokenBalance(memeTokenAddr);
    logger.info({"Token Balance":tokenBalance}, "Token Balance");
}

async function getTokensByOwner(memeTokenAddr){
    //3y9t7HRU8mJAnU61Hboy4KjTLbUhadYUSjNV2oqyS1Rz
    //https://www.quicknode.com/guides/solana-development/spl-tokens/how-to-get-all-tokens-held-by-a-wallet-in-solana
    const filters = [];
    filters.push(
        {
            dataSize: 165, //Size of account (bytes)
        },
        {
            memcmp: {
                offset: 32, //location of our query in the account (bytes)
                bytes: config.ownerAddress,
            }
        },
        {
            memcmp: {
                offset: 0, //number of bytes
                bytes: memeTokenAddr, //base58 encoded string
            }
        }
    );

    const accounts = await connection.getParsedProgramAccounts(
        raydium_sdk_1.TOKEN_PROGRAM_ID,
        {filters}
    );

    logger.info({"Found Token Accounts":accounts.length}, "Found token accounts");

    for (let i = 0; i < accounts.length; i++) {
        //Parse account data
        const parsedAccountInfo = accounts[i].account.data;
        const mintAddress = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

        logger.info({"Token Account":accounts[i].pubkey.toString()}, "Token account address");
        logger.info({"Token Mint":mintAddress}, "Token address");
        logger.info({"Token Balance":tokenBalance}, "Token balance");
    };
}

async function checkBlockHash(){
    const START_TIME = new Date();
        // Get Latest Blockhash
    const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;
    let hashExpired = false;

    hashExpired = await util_1.isBlockhashExpired(connection, lastValidHeight);

    if (hashExpired) {
        const endTime = new Date();
        const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
        logger.info({"Blockhas has expired. Elapsed Time (seconds)" : elapsed}, "Blockhas has expired");
    } else {
        logger.info("Blockhash has not expired.");
    }
}

async function errorStringTest(subString){
    const msg = {"err":{"type":"SendTransactionError","message":"failed to send transaction: Transaction simulation failed: Error processing Instruction 4: custom program error: 0x2a","stack":"Error: failed to send transaction: Transaction simulation failed: Error processing Instruction 4: custom program error: 0x2a\n    at Connection.sendEncodedTransaction (C:\\src\\SOLSniper\\solana-spl-token-sniper\\node_modules\\@solana\\web3.js\\lib\\index.cjs.js:8050:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async Connection.sendRawTransaction (C:\\src\\SOLSniper\\solana-spl-token-sniper\\node_modules\\@solana\\web3.js\\lib\\index.cjs.js:8015:20)\n    at async Connection.sendTransaction (C:\\src\\SOLSniper\\solana-spl-token-sniper\\node_modules\\@solana\\web3.js\\lib\\index.cjs.js:7972:14)","logs":["Program 11111111111111111111111111111111 invoke [1]","Program 11111111111111111111111111111111 success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]","Program log: Instruction: InitializeAccount","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3443 of 1399850 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program 11111111111111111111111111111111 invoke [1]","Program 11111111111111111111111111111111 success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]","Program log: Instruction: InitializeAccount","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3443 of 1396257 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [1]","Program log: Error: User token input does not match amm","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 12520 of 1392814 compute units","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 failed: custom program error: 0x2a"]}};

    if (msg.err.message && msg.err.message.includes(subString)){
        logger.info("skip token");
    } else {
        logger.info("something else is wrong");
    }
}

async function manualSell(marketId, tx, memeTokenAddr){
    logger.info("Starting manual sell");

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
        logger.info({"Token Balance":tokenBalance}, "Token Balance");
    } else {
        logger.info("Token Balance Retrieval Error");
    }

    if (tokenBalance){
        // call swap
        logger.info("Time to sell Meme");
        swap.swapMemeForSol(poolKeys, signature, tokenBalance, memeTokenAddr);
    } else {
        logger.info("Token Balance is null. Cannot sell");
    }
    
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
    logger.info({"Token Balance":tokenBalance}, "Token Balance");
}

async function monitorToken(buyPrice, poolKeys, tokenBalance, signature, memeTokenAddr){
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

/*
async function getTokenPriceInSol(baseVault, quoteVault){
    const baseVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(baseVault));
    const quoteVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(quoteVault));
    const baseVaultAccountAmount = baseVaultAccount.value.uiAmount;
    const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount;
    return (quoteVaultAccountAmount / baseVaultAccountAmount);
}
*/
async function soldMemeTokenResult(tx, poolKeys, ownerAddress){
    // Use tx to determine SOL received from selling Meme coin
    const tokenBalance = await getBalances(tx, poolKeys.quoteMint.toString(), ownerAddress);
    logger.info("Sold Meme for SOL");
    //console.log("Sol used to buy Meme" + buyAmtSol + " Sol P/L: WIP");
    logger.info({"Current SOL Balance" : tokenBalance}, "Current SOL Balance");
}

async function monitorTokenSell(tx, poolKeys, ownerAddress, signature, memeTokenAddr){
    //const tokenBalance = await getBalances(tx, poolKeys.baseMint.toString(), ownerAddress);
    const tokenBalance = await util_1.getWalletMemeTokenBalance(memeTokenAddr);
    if (tokenBalance !== null){
        logger.info("Token Balance Retrieved");
    } else {
        logger.info("Token Balance Retrieval Error");
    }
    
    const buyPrice = (config.amtBuySol / tokenBalance);
    const solPriceUSD = await util_1.getSolanaPriceInUSDC();
    if (solPriceUSD !== null){
        logger.info("SOL Price Retrieved");
    } else {
        logger.info("SOL Price Retrieval Error");
    }
    
    logger.info({"SOL Price in USD" : solPriceUSD}, "SOL Price in USD");
    logger.info({"Meme Buy Price" : buyPrice}, "Meme Buy Price");
    logger.info({"Meme Buy Qty" : tokenBalance}, "Meme Buy Qty");
    
    monitorToken(buyPrice, poolKeys, tokenBalance, signature, memeTokenAddr);
}

async function getTx(tx){
    /*return await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    })*/

    const transaction = await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    });

    /*const transaction = await connection.getParsedTransaction(
        tx,
        { maxSupportedTransactionVersion: 0 },
      );*/

    //console.log("TX: ", transaction);
    return transaction;
}

async function getBalances(tx, tokenAddress, ownerAddress){
    logger.info("Start get balances");
    let validTx = null;
    let i = 0;

    do {
        await new Promise(resolve => setTimeout(resolve, 500));
        validTx = await getTx(tx);

        i++;
    }
    while (i < 15 && validTx === null);

    if(validTx !== null){
        logger.info({"validTx":[validTx]}, "Valid Tx");
        for(const account of validTx.meta.postTokenBalances){
            if(account.mint === tokenAddress && account.owner === ownerAddress){
                return account.uiTokenAmount.uiAmount;
            }
        }
    } else {
        logger.info({"Tx" : tx}, "Cannot retrieve Tx.");
        return 0;
    }
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