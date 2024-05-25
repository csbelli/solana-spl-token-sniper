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
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const config_1 = require("../utils/config.js");
const util_1 = require("../utils/util.js");
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");
const web3 = require("@solana/web3.js");
const logger = require('../logger.js');
const connection = config_1.connection;
const buyAmtSol = config_1.amtBuySol;
const solToken = config_1.solToken;

function swapOnlyAmm(input) {
    return __awaiter(this, void 0, void 0, function* () {
        //const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3.PublicKey(input.tokenAddress), input.poolKeys.lpDecimals);
        const { innerTransactions } = yield raydium_sdk_1.Liquidity.makeSwapInstructionSimple({
            connection: config_1.connection,
            poolKeys: input.poolKeys,
            userKeys: {
                tokenAccounts: input.walletTokenAccounts,
                owner: input.wallet.publicKey,
            },
            amountIn: input.inputTokenAmount,
            amountOut: new raydium_sdk_1.TokenAmount(input.outputToken, 1),
            fixedSide: 'in',
            makeTxVersion: config_1.makeTxVersion,
        });
        return { txids: yield (0, util_1.buildAndSendTx)(innerTransactions) };
    });
}

function swapSolForMeme(poolKeys, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerAddress = config_1.ownerAddress;
        const inputToken = solToken;
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(inputToken, LAMPORTS_PER_SOL * buyAmtSol);
        const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3.PublicKey(poolKeys.baseMint.toString()), poolKeys.lpDecimals);
        const slippage = new raydium_sdk_1.Percent(15, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);

        swapOnlyAmm({
            poolKeys,
            tokenAddress: poolKeys.baseMint.toString(), 
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
            outputToken
        }).then(({ txids }) => {
            /** continue with txids */
            logger.info({'Swap Sol for Meme txids' : [txids]}, "SOL to Meme TxnIDs");
            if(txids.length === 1){
                //monitorTokenSell(txids[0], poolKeys.baseMint.toString(), ownerAddress, poolKeys.baseVault.toString(), poolKeys.quoteVault.toString());
                monitorTokenSell(txids[0], poolKeys, ownerAddress, signature);
            }
        }).catch(error => {
            //logger.info({"Signatures":[signature]}, "Signatures");
            logger.error(error, "Error swapping SOL for Meme");
            swapSolForMeme(poolKeys, signature);
        })
    });
}
exports.swapSolForMeme = swapSolForMeme

function swapMemeForSol(poolKeys, signature, tokenBalance) {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerAddress = config_1.ownerAddress;
        const inputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3.PublicKey(poolKeys.baseMint.toString()), poolKeys.lpDecimals);
        const inputTokenAmount = new raydium_sdk_1.TokenAmount(inputToken, LAMPORTS_PER_SOL * tokenBalance);
        const outputToken = solToken;
        const slippage = new raydium_sdk_1.Percent(15, 100);
        const walletTokenAccounts = yield (0, util_1.getWalletTokenAccount)(config_1.connection, config_1.wallet.publicKey);

        logger.info("Trying to swap Meme for SOL");

        swapOnlyAmm({
            poolKeys,
            tokenAddress: poolKeys.quoteMint.toString(), 
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config_1.wallet,
            outputToken
        }).then(({ txids }) => {
            /** continue with txids */
            logger.info({'Swap Meme for Sol txids' : [txids]}, "Swap Meme to SOL TxnIDs");
            if(txids.length === 1){
                soldMemeTokenResult(txids[0], poolKeys, ownerAddress);
            }
        }).catch(error => {
            //logger.info({"Signatures":[signature]}, "Signatures");
            logger.error(error, "Error swapping Meme for SOL");
            swapMemeForSol(poolKeys, signature, tokenBalance);
        })
    });
}
exports.swapMemeForSol = swapMemeForSol

async function getTx(tx){
    return await connection.getTransaction(tx, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    })
}

async function getBalances(tx, tokenAddress, ownerAddress){
    let validTx = await getTx(tx);
    while(validTx === null){
        validTx = await getTx(tx);
        if(validTx !== null){
            for(const account of validTx.meta.postTokenBalances){
                if(account.mint === tokenAddress && account.owner === ownerAddress){
                    return account.uiTokenAmount.uiAmount;
                }
            }
        }
    }
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
    const buyPrice = (buyAmtSol / tokenBalance);
    const solPriceUSD = util_1.getSolanaPriceInUSDC();

    logger.info({"SOL Price in USD" : solPriceUSD}, "SOL Price in USD");
    logger.info({"Meme Buy Price" : buyPrice}, "Meme Buy Price");
    logger.info({"Meme Buy Qty" : tokenBalance}, "Meme Buy Qty");
    
    monitorToken(buyPrice, poolKeys, tokenBalance, signature);
}

/*async function monitorTokenSell(tx, tokenAddress, ownerAddress, baseVault, quoteVault){
    const tokenBalance = await getBalances(tx, tokenAddress, ownerAddress);
    const buyPrice = (buyAmtSol / tokenBalance);
    monitorToken(buyPrice, baseVault, quoteVault, tokenBalance);
}*/

async function monitorToken(buyPrice, poolKeys, tokenBalance, signature){
    let count = 0;
    const maxIntervals = 9;

    let interval = setInterval(async () => {
        if (count >= maxIntervals) {
            clearInterval(interval);
            
            // call swap
            logger.info("Time to sell Meme");
            swapMemeForSol(poolKeys, signature, tokenBalance);

            return;
        }
        /*
        const currentPrice = await getTokenPriceInSol(poolKeys.baseVault.toString(), poolKeys.quoteVault.toString());
        logger.info({"Buy Price" : buyPrice, "Current Price" : currentPrice}, "Buy and Current Price Details");
        const percentIncrease = ((buyPrice - currentPrice) / buyPrice) * 100;
        logger.info({"Percent Change" : percentIncrease}, "Percent Change");
        */
        count++;
    }, 5000)
}

/* async function monitorToken(buyPrice, baseVault, quoteVault, tokenBalance){
    let count = 0;
    const maxIntervals = 9;

    let interval = setInterval(async () => {
        if (count >= maxIntervals) {
            clearInterval(interval);

            // call swap


            return;
        }

        const currentPrice = await getTokenPriceInSol(baseVault, quoteVault);
        console.log("buy price: " + buyPrice + " current price: " + currentPrice);
        const percentIncrease = ((buyPrice - currentPrice) / buyPrice) * 100;
        console.log("percent increase: " + percentIncrease);

        count++;
    }, 500)
} */