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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepTime = exports.getATAAddress = exports.buildAndSendTx = exports.getWalletTokenAccount = exports.sendTx = exports.isBlockhashExpired = exports.getTokensByOwner = exports.getWalletMemeTokenBalance = exports.buildAndSendOptimalTransaction = exports.sendOptimalTransaction = void 0;
const raydium = require("@raydium-io/raydium-sdk");
const web3 = require("@solana/web3.js");
const config = require("./config");
const logger = require('../logger.js');
const { getSimulationComputeUnits } = require("@solana-developers/helpers");

// Token program errors
// https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/error.rs
const tokenProgramErrors = [
    "Lamport balance below rent-exempt threshold",
    "Insufficient funds",
    "Invalid Mint",
    "Account not associated with this Mint",
    "Owner does not match",
    "Fixed supply",
    "Already in use",
    "Invalid number of provided signers",
    "Invalid number of required signers",
    "State is unititialized",
    "Instruction does not support native tokens",
    "Non-native account can only be closed if its balance is zero",
    "Invalid instruction",
    "State is invalid for requested operation",
    "Operation overflowed",
    "Account does not support specified authority type",
    "This token mint cannot freeze accounts",
    "Account is frozen",
    "The provided decimals value different from the Mint decimals",
    "Instruction does not support non-native tokens",
];

function sendTx(connection, payer, txs, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const START_TIME = new Date();
        // Get Latest Blockhash
        const blockhashResponse = yield connection.getLatestBlockhashAndContext('finalized');
        const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

        options = {skipPreflight: true, maxRetries: 20};

        const txids = [];
        for (const iTx of txs) {
            if (iTx instanceof web3.VersionedTransaction) {
                iTx.sign([payer]);
                txids.push(yield connection.sendTransaction(iTx, options));
            }
            else {
                txids.push(yield connection.sendTransaction(iTx, [payer], options));
            }
        }
        logger.info({"SendTX Start Time":START_TIME,"End Time":new Date().getTime()}, "SendTX start and end time");
        logger.info({"Attempted Tx" : txids}, "Attempted Tx IDs");

        // Check transaction status and blockhash status until the transaction succeeds or blockhash expires
        let hashExpired = false;
        let txSuccess = false;
        logger.info("Start tx success or blockhash expired check.");
        while (!hashExpired && !txSuccess) {
            const { value: status } = yield connection.getSignatureStatus(txids[0]);
    
            // Break loop if transaction has succeeded
            if (status && ((status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
                txSuccess = true;
                const endTime = new Date();
                const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
                logger.info({"Tx Success. Elapsed Time (seconds)" : elapsed}, "Tx Success");
                //console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`);
                
                break;
            }
    
            hashExpired = yield isBlockhashExpired(connection, lastValidHeight);
            
            // Break loop if blockhash has expired
            if (hashExpired) {
                const endTime = new Date();
                const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
                logger.info({"Blockhash has expired. Elapsed Time (seconds)" : elapsed}, "Blockhash has expired");
                
                txids.push("expired");
                // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
                break;
            }
    
            // Check again after 2.5 sec
            yield sleepTime(500);
        }

        return txids;
    });
}
exports.sendTx = sendTx;

function buildAndSendTx(innerSimpleV0Transaction, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const willSendTx = yield (0, raydium.buildSimpleTransaction)({
            connection: config.connection,
            makeTxVersion: config.makeTxVersion,
            payer: config.wallet.publicKey,
            innerTransactions: innerSimpleV0Transaction,
            addLookupTableInfo: config.addLookupTableInfo,
        });
        return yield sendTx(config.connection, config.wallet, willSendTx, options);
    });
}
exports.buildAndSendTx = buildAndSendTx;

function buildAndSendOptimalTransaction(swapTransaction) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info({"Instructions passed in":swapTransaction}, "Passed in instructions");
        
        // Get optimal priority fees - https://solana.com/developers/guides/advanced/how-to-use-priority-fees
        const microLamports = 300;
        //const instructionsParsed = JSON.parse(swapTransaction);
        //const instructions = instructionsParsed.instructions;

        const units = yield getSimulationComputeUnits(config.connection, swapTransaction.instructions, config.wallet.publicKey);
        const blockhashResponse = yield connection.getLatestBlockhashAndContext('finalized');

        instructions.unshift(web3.ComputeBudgetProgram.setComputeUnitPrice(microLamports));

        if (units) {
            //Add 10% to units to cover cases where the actual cost is more than simulated
            const unitsWithMargin = units + (units * 0.1);
            instructions.unshift(web3.ComputeBudgetProgram.setComputeUnitLimit(unitsWithMargin));
        }

        const transactionMessage = new web3.transactionMessage(instructions, blockhashResponse.blockhash, config.ownerAddress).compileToV0Message(config.addLookupTableInfo);
        
        const transaction = new web3.VersionedTransaction(transactionMessage, blockhashResponse);

        return yield sendOptimalTransaction(transaction, blockhashResponse);
    });
}
exports.buildAndSendOptimalTransaction = buildAndSendOptimalTransaction;

function sendOptimalTransaction(transaction, blockhashResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        const START_TIME = new Date();
        // Get Latest Blockhash
        const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

        options = {skipPreflight: true, maxRetries: 20};

        const txids = [];
        for (const iTx of txs) {
            if (iTx instanceof web3.VersionedTransaction) {
                iTx.sign([payer]);
                txids.push(yield connection.sendTransaction(iTx, options));
            }
            else {
                txids.push(yield connection.sendTransaction(iTx, [payer], options));
            }
        }
        logger.info({"SendTX Start Time":START_TIME,"End Time":new Date().getTime()}, "SendTX start and end time");
        logger.info({"Attempted Tx" : txids}, "Attempted Tx IDs");

        // Check transaction status and blockhash status until the transaction succeeds or blockhash expires
        let hashExpired = false;
        let txSuccess = false;
        logger.info("Start tx success or blockhash expired check.");
        while (!hashExpired && !txSuccess) {
            const { value: status } = yield connection.getSignatureStatus(txids[0]);
    
            // Break loop if transaction has succeeded
            if (status && ((status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
                txSuccess = true;
                const endTime = new Date();
                const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
                logger.info({"Tx Success. Elapsed Time (seconds)" : elapsed}, "Tx Success");
                //console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`);
                
                break;
            }
    
            hashExpired = yield isBlockhashExpired(connection, lastValidHeight);
            
            // Break loop if blockhash has expired
            if (hashExpired) {
                const endTime = new Date();
                const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
                logger.info({"Blockhash has expired. Elapsed Time (seconds)" : elapsed}, "Blockhash has expired");
                
                txids.push("expired");
                // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
                break;
            }
    
            // Check again after 2.5 sec
            yield sleepTime(500);
        }

        return txids; 
    });
}
exports.sendOptimalTransaction = sendOptimalTransaction;

function isBlockhashExpired(connection, lastValidBlockHeight) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentBlockHeight = (yield connection.getBlockHeight('finalized'));
        //logger.info({"Current Block Height" : currentBlockHeight}, "Current block height");
        //logger.info({"Last Valid Block Height - 150" : lastValidBlockHeight - 150}, "Last valid block height - 150");
        //logger.info({"Blockheight Difference" : currentBlockHeight - (lastValidBlockHeight - 150)}, "Blockheight difference"); // If Difference is positive, blockhash has expired.
        
        return (currentBlockHeight > (lastValidBlockHeight - 150));
    });
}
exports.isBlockhashExpired = isBlockhashExpired;

function getWalletMemeTokenBalance(memeTokenAddr) {
    return __awaiter(this, void 0, void 0, function* () {
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

        const accounts = yield config.connection.getParsedProgramAccounts(
            raydium.TOKEN_PROGRAM_ID,
            {filters}
        );

        logger.info("Start get wallet meme token balance.");

        if (accounts){
            const parsedAccountInfo = accounts[0].account.data;
            const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

            logger.info({"Token Balance":tokenBalance}, "Token balance");
            return tokenBalance;
        } else {
            logger.info("Error retrieving token balance");
            return 0;
        }
    });
}
exports.getWalletMemeTokenBalance = getWalletMemeTokenBalance;

//if memeTokenAddr = "" all tokens are returned
function getTokensByOwner(memeTokenAddr) {
    return __awaiter(this, void 0, void 0, function* () {
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

        const accounts = yield config.connection.getParsedProgramAccounts(
            raydium.TOKEN_PROGRAM_ID,
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
    });
}
exports.getTokensByOwner = getTokensByOwner;

function getWalletTokenAccount(connection, wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        const walletTokenAccount = yield connection.getTokenAccountsByOwner(wallet, {
            programId: raydium.TOKEN_PROGRAM_ID,
        });
        return walletTokenAccount.value.map((i) => ({
            pubkey: i.pubkey,
            programId: i.account.owner,
            accountInfo: raydium.SPL_ACCOUNT_LAYOUT.decode(i.account.data),
        }));
    });
}
exports.getWalletTokenAccount = getWalletTokenAccount;

function getATAAddress(programId, owner, mint) {
    const { publicKey, nonce } = (0, raydium.findProgramAddress)([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));
    return { publicKey, nonce };
}
exports.getATAAddress = getATAAddress;

function getSolanaPriceInUSDC() {
    return __awaiter(this, void 0, void 0, function* () {
        const accountInfo = yield config.connection.getAccountInfo(new web3.PublicKey("8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj"));

        const poolData = raydium.PoolInfoLayout.decode(accountInfo.data);
        const priceInUSDC = raydium.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2);
        logger.info({"current price" : priceInUSDC}, "Current SOL Price in USD");

        return priceInUSDC;
    });
}
exports.getSolanaPriceInUSDC = getSolanaPriceInUSDC;

function checkMintAuthorityRevoked(tokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenInfo = yield config.connection.getParsedAccountInfo(new web3.PublicKey(tokenAddress));
        //console.log("tokenInfo: ", tokenInfo);
        //console.log("data parsed: ", tokenInfo.value.data.parsed);
        //console.log("mint authority revoked check: ", tokenInfo.value.data.parsed.info.mintAuthority);
        if (tokenInfo.value.data.parsed.info.mintAuthority === null) {
            return true;
        } else {
            return false;
        }
    });
}
exports.checkMintAuthorityRevoked = checkMintAuthorityRevoked;

function sleepTime(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        //console.log((new Date()).toLocaleString(), 'sleepTime', ms);
        //logger.info("sleepTime");
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
exports.sleepTime = sleepTime;
//# sourceMappingURL=util.js.map