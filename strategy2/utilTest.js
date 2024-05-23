const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config = require('../utils/config.js');
const util_1 = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');
const { info } = require('console');
const derivePoolKeys = require('./derivePoolKeys.js');
const logger = require('../logger.js');

const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const connection = config.connection;

//tryCode("3MsMCSEoeuJrrnwAkfepNeC5AsrFkps4zKKFAQSRmKtY");
//decimalTest("99p7VwKhHsKEmCmEDQFfED27p6FotRJTPNdngyKbqXdo");
getSolanaPrice();
//getLPData("HYwNHiwqAnCZHgWQZzprkuFWmzcE26MAiHPcWH6zBKXq");

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

async function getSolanaPrice(){
    const accountInfo = await connection.getAccountInfo(new web3.PublicKey("8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj"));

    //if (accountInfo === null) throw Error(' get pool info error ')

    const poolData = raydium_sdk_1.PoolInfoLayout.decode(accountInfo.data);

    //console.log('current price -> ', raydium_sdk_1.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2));
    logger.info({"Current SOL Price: ":raydium_sdk_1.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2)});
}

async function getLPData(marketId){
    const keyData = await connection.getAccountInfo(new web3.PublicKey(marketId));
    const marketDeco = await getDecodedData(keyData);

    const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
    logger.info({"Pool Keys:":[poolKeys]}, "Pool Keys");

    const data = await connection
        .getAccountInfo(new web3.PublicKey(poolKeys.id))
        .then((info) => raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data));

    console.log("Pool Open Time: ", new Date(Number(data.poolOpenTime.toString() * 1000)));
    console.log("Decoded LP Data: ", data);
    console.log("maxOrder: ", data.maxOrder.toString());
    console.log("minSize: ", data.minSize.toString());


    const lpMintAccInfo = await connection.getParsedAccountInfo(new web3.PublicKey(data.lpMint));
    const mintInfo = lpMintAccInfo?.value?.data?.parsed?.info;

    console.log("mintInfo: ", mintInfo);
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