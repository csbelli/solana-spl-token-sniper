"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const raydium = require("@raydium-io/raydium-sdk");
const config = require("../utils/config.js");
const util = require("../utils/util.js");
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");
const web3 = require("@solana/web3.js");
const logger = require('../logger.js');
const connection = config.connection;
const buyAmtSol = config.amtBuySol;
const solToken = config.solToken;

function swapOnlyAmm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        //const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3.PublicKey(input.tokenAddress), input.poolKeys.lpDecimals);
        const { innerTransactions } = yield raydium.Liquidity.makeSwapInstructionSimple({
            connection: config.connection,
            poolKeys: input.poolKeys,
            userKeys: {
                tokenAccounts: input.walletTokenAccounts,
                owner: input.wallet.publicKey,
            },
            amountIn: input.inputTokenAmount,
            amountOut: new raydium.TokenAmount(input.outputToken, 1),
            fixedSide: 'in',
            makeTxVersion: config.makeTxVersion,
        });
        //return { txids: yield (0, util_1.buildAndSendTx)(innerTransactions) };
        return { txids: yield (0, util.buildAndSendOptimalTransaction)(innerTransactions) };
    });
}

function swapSolForMeme(poolKeys, signature, memeTokenAddr, snipeLaunch) {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerAddress = config.ownerAddress;
        const inputToken = solToken;
        const inputTokenAmount = new raydium.TokenAmount(inputToken, LAMPORTS_PER_SOL * buyAmtSol);
        const outputToken = new raydium.Token(raydium.TOKEN_PROGRAM_ID, new web3.PublicKey(memeTokenAddr), poolKeys.lpDecimals);
        const slippage = new raydium.Percent(100, 100);
        const walletTokenAccounts = yield (0, util.getWalletTokenAccount)(config.connection, config.wallet.publicKey);

        swapOnlyAmm({
            poolKeys,
            tokenAddress: memeTokenAddr, 
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config.wallet,
            outputToken
        }).then(({ txids }) => {
            /** continue with txids */
            logger.info({'Swap Sol for Meme txids' : txids}, "SOL to Meme TxnIDs");
            if(txids.length === 1){
                //monitorTokenSell(txids[0], poolKeys.baseMint.toString(), ownerAddress, poolKeys.baseVault.toString(), poolKeys.quoteVault.toString());
                monitorTokenSell(txids[0], poolKeys, ownerAddress, signature, memeTokenAddr);
            } else if (txids.length > 1) {
                if (snipeLaunch){
                    logger.info("Swap Sol for Meme Block Expired - Sniping - Retry Swap");
                    swapSolForMeme(poolKeys, signature, memeTokenAddr, snipeLaunch);
                } else {
                    logger.info("Swap Sol for Meme Block Expired - Not Sniping - Skipping Token");
                }
            }
        }).catch(error => {
            //logger.info({"Signatures":[signature]}, "Signatures");
            logger.error(error, "Error swapping SOL for Meme");

            if (error.message && error.message.includes("Error processing Instruction 4")){
                logger.info("Transaction contains errors, skipping token.");
            } //else {
              //  logger.info("Trying transaction again");
              //  swapSolForMeme(poolKeys, signature, memeTokenAddr, snipeLaunch);
            //}
        })
    });
}
exports.swapSolForMeme = swapSolForMeme

function swapMemeForSol(poolKeys, signature, tokenBalance, memeTokenAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerAddress = config.ownerAddress;
        const inputToken = new raydium.Token(raydium.TOKEN_PROGRAM_ID, new web3.PublicKey(memeTokenAddr), poolKeys.lpDecimals);
        const inputTokenAmount = new raydium.TokenAmount(inputToken, LAMPORTS_PER_SOL * tokenBalance);
        const outputToken = solToken;
        const slippage = new raydium.Percent(100, 100);
        const walletTokenAccounts = yield (0, util.getWalletTokenAccount)(config.connection, config.wallet.publicKey);
        const snipeLaunch = false;

        logger.info("Trying to swap Meme for SOL");

        swapOnlyAmm({
            poolKeys,
            tokenAddress: solToken, 
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config.wallet,
            outputToken
        }).then(({ txids }) => {
            /** continue with txids */
            logger.info({'Swap Meme for Sol txids' : txids}, "Swap Meme to SOL TxnIDs");
            if(txids.length === 1){
                soldMemeTokenResult(txids[0], poolKeys, ownerAddress, memeTokenAddr);
            } else if (txids.length > 1) {
                logger.info("Swap Meme for Sol Block Expired. Retrying Swap.");
                swapMemeForSol(poolKeys, signature, tokenBalance, memeTokenAddr);
            }
        }).catch(error => {
            //logger.info({"Signatures":[signature]}, "Signatures");
            logger.error(error, "Error swapping Meme for SOL");
            //swapMemeForSol(poolKeys, signature, tokenBalance, memeTokenAddr);
        })
    });
}
exports.swapMemeForSol = swapMemeForSol

async function getTx(tx){
    const transaction = await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    });

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
    while (i < 25 && validTx === null);

    if(validTx !== null){
        for(const account of validTx.meta.postTokenBalances){
            if(account.mint === tokenAddress && account.owner === ownerAddress){
                return account.uiTokenAmount.uiAmount;
            }
        }
    } else {
        logger.info({"Tx" : tx}, "Cannot retrieve Tx.");
        return -99;
    }
}

async function getTokenPriceInSol(memeTokenAddr, solToken){
    const baseVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(memeTokenAddr));
    const quoteVaultAccount = await connection.getTokenAccountBalance(new web3.PublicKey(solToken));
    const baseVaultAccountAmount = baseVaultAccount.value.uiAmount;
    const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount;
    return (quoteVaultAccountAmount / baseVaultAccountAmount);
}

async function soldMemeTokenResult(tx, poolKeys, ownerAddress){
    // Use tx to determine SOL received from selling Meme coin
    //const tokenBalance = await getBalances(tx, solToken, ownerAddress);
    logger.info("Sold Meme for SOL");
    //console.log("Sol used to buy Meme" + buyAmtSol + " Sol P/L: WIP");
    //logger.info({"Current SOL Balance" : tokenBalance}, "Current SOL Balance");
}

async function monitorTokenSell(tx, poolKeys, ownerAddress, signature, memeTokenAddr){
    //const tokenBalance = await getBalances(tx, memeTokenAddr, ownerAddress);
    let i = 0;
    let tokenBalance = -99;

    do {
        await new Promise(resolve => setTimeout(resolve, 500));
        //tokenBalance = await getBalances(tx, memeTokenAddr, ownerAddress);
        tokenBalance = await util.getWalletMemeTokenBalance(memeTokenAddr);

        i++;
    }
    while (i < 25 && tokenBalance === -99);

    if (tokenBalance > -99) {
        const buyPrice = (buyAmtSol / tokenBalance);
        const solPriceUSD = await util.getSolanaPriceInUSDC();

        logger.info({"SOL Price in USD" : solPriceUSD}, "SOL Price in USD");
        logger.info({"Meme Buy Price" : buyPrice}, "Meme Buy Price");
        logger.info({"Meme Buy Qty" : tokenBalance}, "Meme Buy Qty");
    } else {
        logger.info("Cannot get token balance after 625 tries. Try to sell 200 tokens to get some money back.");
        tokenBalance = 200;
    }
    
    monitorToken(buyPrice, poolKeys, tokenBalance, signature, memeTokenAddr);
}

/*async function monitorTokenSell(tx, tokenAddress, ownerAddress, baseVault, quoteVault){
    const tokenBalance = await getBalances(tx, tokenAddress, ownerAddress);
    const buyPrice = (buyAmtSol / tokenBalance);
    monitorToken(buyPrice, baseVault, quoteVault, tokenBalance);
}*/

async function monitorToken(buyPrice, poolKeys, tokenBalance, signature, memeTokenAddr){
    let count = 0;
    const maxIntervals = 9;

    let interval = setInterval(async () => {
        if (count >= maxIntervals) {
            clearInterval(interval);
            
            // call swap
            logger.info("Time to sell Meme");
            swapMemeForSol(poolKeys, signature, tokenBalance, memeTokenAddr);

            return;
        }
        /*
        const currentPrice = await getTokenPriceInSol(memeTokenAddr, solToken);
        logger.info({"Buy Price" : buyPrice, "Current Price" : currentPrice}, "Buy and Current Price Details");
        const percentIncrease = ((buyPrice - currentPrice) / buyPrice) * 100;
        logger.info({"Percent Change" : percentIncrease}, "Percent Change");
        */
        count++;
    }, 5000)
}