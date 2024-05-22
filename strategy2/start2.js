const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const WebSocket = require('ws');
const derivePoolKeys = require('./derivePoolKeys.js');
const swap = require('./swap2.js');
const config = require('../utils/config.js');
const util_1 = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');

// OpenBook
// Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
// https://solana.com/ecosystem/openbook
// Community-led fork of SerumV3 program
const openbookProgramId = new web3.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");

const connection = config.connection;

let ws = null;

openWebSocket();

/*const ws = new WebSocket(config.websocketConnection)
    ws.onopen = () => {
        ws.send(
            JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'blockSubscribe',
                params: [{"mentionsAccountOrProgram": openbookProgramId}, {"commitment": "confirmed", "maxSupportedTransactionVersion": 0, "encoding": "jsonParsed"}]
            })
        )
    }*/

/*ws.on('message', (evt) => {
    try {
        const buffer = evt.toString('utf8');
        parseTxs(JSON.parse(buffer));
        return;
    } catch (e) {
        console.log(e)
    }
})*/

function openWebSocket(){
    console.log("Opening WebSocket");
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
        console.log("txsFromblock is undefined.")
        return;
    }
    
    const allTx = txsFromBlock.params.result.value.block.transactions;
    for(const tx of allTx){
        if(parseLogs(tx.meta.logMessages) && tx.transaction.message.accountKeys.length === 13 && tx.transaction.message.instructions.length === 6){
            console.log("txsFromBlock found.")
            if(ws.readyState === ws.OPEN){
                ws.close();
                console.log("Closing websocket.")
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
        //console.log("Key:", key);
        const keyData = await connection.getAccountInfo(new web3.PublicKey(key.pubkey));
        if(keyData !== null && keyData.data.length === 388){
            marketId = key.pubkey;
            marketInfo = keyData;
            console.log("Key with marketId:", key);
            
            //If we are in here we have what we need so break out of the loop.
            break;
        }
    }

    if(marketId === null){
        parseAccountKeys(keys);
    } else{
        console.log("Found Time: ", new Date().toLocaleString());
        console.log("MarketID: ", marketId);

        const marketDeco = await getDecodedData(marketInfo);

        let tokenAddress = marketDeco.baseMint;
        //Some coins have the base and quote reversed.
        if(tokenAddress.toString() === "So11111111111111111111111111111111111111112"){
            tokenAddress = marketDeco.quoteMint;
        }

        console.log("Token Address: ", tokenAddress.toString());

        // tokenInfo.value.data.parsed includes: info, type (ex. mint)
        // tokenInfo.value.data.parsed.info includes: decimals, freezeAuthority, isInitialized, mintAuthority, supply
        const tokenInfo = await connection.getParsedAccountInfo(new web3.PublicKey(tokenAddress));
        
        // Verify the token has "mint authority revoked"
        if (tokenInfo.value.data.parsed.info.mintAuthority !== null) {
            console.log("Mint authority is not revoked.");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
        } else {
            console.log("Mint authority is revoked.");
        }
        
        // Verify the token has "freeze authority revoked"
        if (tokenInfo.value.data.parsed.info.freezeAuthority !== null) {
            console.log("Freeze authority is not revoked.");

            if(ws.readyState === ws.CLOSED){
                openWebSocket();
            }

            return;
        } else {
            console.log("Freeze authority is revoked.");
        }

        //It seems initial supply of 100M seems to have better initial growth than an intitial supply of 1B
        const getTokenSupply = await connection.getTokenSupply(new web3.PublicKey(tokenAddress));
        console.log("Supply: ", getTokenSupply.value.uiAmount);
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
        console.log("Pool Keys:", poolKeys);

        //Using poolKeys.id.toString(), the poolOpenTime can be returned. If the open time is more than a few minutes in the
        //future, schedule the buy for just before that time.
        const lpData = await connection
            .getAccountInfo(new web3.PublicKey(poolKeys.id))
            .then((info) => raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data));

        console.log("Pool Open Time: ", new Date(Number(lpData.poolOpenTime.toString() * 1000)));

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

