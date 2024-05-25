const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const WebSocket = require('ws');
const derivePoolKeys = require('./derivePoolKeys.js');
const swap = require('./swap2.js');
const config = require('../utils/config.js');
const util_1 = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');
const logger = require('../logger.js');

// OpenBook
// Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
// https://solana.com/ecosystem/openbook
// Community-led fork of SerumV3 program
const openbookProgramId = new web3.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");

const connection = config.connection;

let ws = null;

openWebSocket();

function openWebSocket(){
    logger.info("Opening WebSocket");
    ws = new WebSocket(config.websocketConnection)
    ws.onopen = () => {
        ws.send(
            JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'blockSubscribe',
                params: [{"mentionsAccountOrProgram": openbookProgramId}, {"commitment": "confirmed", "maxSupportedTransactionVersion": 0, "encoding": "jsonParsed"}]
            })
        )
    }

    ws.on('message', (evt) => {
        try {
            const buffer = evt.toString('utf8');
            parseTxs(JSON.parse(buffer));
            return;
        } catch (e) {
            console.log(e)
        }
    })
}

function parseTxs(txsFromBlock){
    if(txsFromBlock.params === undefined){
        logger.info("txsFromblock is undefined.")
        return;
    }
    
    const allTx = txsFromBlock.params.result.value.block.transactions;
    for(const tx of allTx){
        if(parseLogs(tx.meta.logMessages) && tx.transaction.message.accountKeys.length === 13 && tx.transaction.message.instructions.length === 6){
            logger.info("txsFromBlock found.")
            if(ws.readyState === ws.OPEN){
                ws.close();
                logger.info("Closing websocket.")
            }
            
            //console.log("Current Solana Price:", util_1.getSolanaPriceInUSDC(connection));
            //console.log("Transaction Signatures:", tx.transaction.signatures)
            parseAccountKeys(tx.transaction.message.accountKeys, tx.transaction.signatures);
        }
    }
}

function parseLogs(logs) {
    const programId = "Program " + openbookProgramId;
    const invoke = logs.some(log => log.includes(`${programId} invoke`));
    const consumed = logs.some(log => log.includes(`${programId} consumed`));
    const success = logs.some(log => log.includes(`${programId} success`));

    return invoke && consumed && success;
}

async function parseAccountKeys(keys, signature){
    let marketId = null;
    let marketInfo = null;

    for(const key of keys){
        const keyData = await connection.getAccountInfo(new web3.PublicKey(key.pubkey));
        if(keyData !== null && keyData.data.length === 388){
            marketId = key.pubkey;
            marketInfo = keyData;
            logger.info({"Key with marketId: " : key}, "MarketID Key");
            
            //If we are in here we have what we need so break out of the loop.
            break;
        }
    }

    if(marketId === null){
        parseAccountKeys(keys);
    } else{
        logger.info({"Found Time: " : new Date().toLocaleString()}, "Found");
        logger.info({"MarketID: " : marketId}, "MarketID");

        const marketDeco = await getDecodedData(marketInfo);

        let tokenAddress = marketDeco.baseMint;
        //Some coins have the base and quote reversed.
        if(tokenAddress.toString() === "So11111111111111111111111111111111111111112"){
            tokenAddress = marketDeco.quoteMint;
        }

        logger.info({"Token Address: " : tokenAddress.toString()}, "Token Address");

        // tokenInfo.value.data.parsed includes: info, type (ex. mint)
        // tokenInfo.value.data.parsed.info includes: decimals, freezeAuthority, isInitialized, mintAuthority, supply
        const tokenInfo = await connection.getParsedAccountInfo(new web3.PublicKey(tokenAddress));
        
        // Verify the token has "mint authority revoked"
        if (tokenInfo.value.data.parsed.info.mintAuthority !== null) {
            logger.info("Mint authority is not revoked.");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
        } else {
            logger.info("Mint authority is revoked.");
        }
        
        // Verify the token has "freeze authority revoked"
        if (tokenInfo.value.data.parsed.info.freezeAuthority !== null) {
            logger.info("Freeze authority is not revoked.");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
        } else {
            logger.info("Freeze authority is revoked.");
        }

        //It seems initial supply of 100M seems to have better initial growth than an intitial supply of 1B
        const getTokenSupply = await connection.getTokenSupply(new web3.PublicKey(tokenAddress));
        logger.info({"Supply: " : getTokenSupply.value.uiAmount}, "Token Supply");
        /*if(getTokenSupply.value.uiAmount > 100000000){
            console.log("Supply is > 100M");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
        } else {
            console.log("Supply 100M or less");
        }*/

        //Add code to check the top 10 holders pass thresholds. Including single holder threshold excluding Raydium wallet.
        //If it does not pass this check, sell after 30 seconds instead of a 60 seconds.
        //await solana.getTokenSupply(new web3.PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
        //await solana.getTokenLargestAccounts(new web3.PublicKey("1YDQ35V8g68FGvcT85haHwAXv1U7XMzuc4mZeEXfrjE")

        //Add code to check intial liquidity if possible during the buy spamming and cancel if not between
        //$3000 and $15000. How can I pull "Initial Liquidity"? If this cannot be obtained before the buy,
        //check immediately after the buy and if the value is ouside the range, just sell and restart the socket.
        
        const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
        logger.info({"Pool Keys:" : [poolKeys]}, "Pool Keys");

        //Using poolKeys.id.toString(), the poolOpenTime can be returned. If the open time is more than a few minutes in the
        //future, schedule the buy for just before that time.
        const info = await connection.getAccountInfo(new web3.PublicKey(poolKeys.id));

        if (info !== null){
            lpDecoded = await raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
        } else {
            // May want to loop for 5 minutes to snipe if LP is null
            logger.info("LP Info is NULL");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
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
        
        //If pool open time is more than 5 minutes from now, log info for scheduled snipe buy.
        logger.info("Time to buy Meme");
        swap.swapSolForMeme(poolKeys, signature);
    }
}

async function checkTokenAccountHolders(tokenAddress) {
    const tokenInfo = await connection.getTokenLargestAccounts(new web3.PublicKey(tokenAddress));
    
    //verify no account, other than Raydium, hold more than 15% of the total supply
    
    return tokenInfo;
}

async function getDecodedData(marketInfo){
    return await Market.getLayout(openbookProgramId).decode(marketInfo.data);
}

