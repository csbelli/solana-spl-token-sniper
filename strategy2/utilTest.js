const web3 = require('@solana/web3.js');
const raydium = require("@raydium-io/raydium-sdk");
const config = require('../utils/config.js');
const util = require("../utils/util.js");
const {Market} = require('@openbook-dex/openbook');
const { info } = require('console');
const derivePoolKeys = require('./derivePoolKeys.js');
const logger = require('../logger.js');
const swap = require('./swap2.js');

var BN = require('bn.js');
const bs58 = require('bs58');
//const { GetProgramAccountsFilter } = require("@solana/web3.js");
var superstruct = require('superstruct');

const solToken = config.solToken;
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");
const buyAmtSol = config.amtBuySol;
const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const connection = config.connection;
const { getSimulationComputeUnits } = require("@solana-developers/helpers");

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }
var BN__default = /*#__PURE__*/_interopDefaultCompat(BN);
var bs58__default = /*#__PURE__*/_interopDefaultCompat(bs58);
const PUBLIC_KEY_LENGTH = 32;
const SOLANA_SCHEMA = new Map();

//marketId, Tx, memeTokenAddr
//manualSell("", "", ""); 
//recentPrioritizationFee('HgZC3mzFwiavbiWd5cx3KqAoD7YyDZGiG9msbqZh1e7L');//raydium_sdk_1.TOKEN_PROGRAM_ID);
//testTokenPriceInSol("52bscamMwyqkNeqa2L3TR55bNrFL3y8wP4ussAuTpump", config.solToken);

//simComputeSample();
//percTest();
async function percTest() {
    logger.info({"percent test": new raydium.Percent(50,100)},"perc test");
}

simComputeDebug("AGozmqEAHRCFnidp9mLCqq7H1PG7zX5STGUogyXz9QWY");
async function simComputeDebug(marketId) {
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
    let tokenAddress = marketDeco.baseMint;
    let snipeLaunch = false;
    const poolKeys = await derivePoolKeys.derivePoolKeys(marketId, marketDeco);
    if (poolKeys !== null) {
        logger.info("Pool Keys Retrieved");
    } else {
        logger.info("Pool Keys Retrieval error");
    }

    logger.info("Time to buy Meme");

    try {
        await swapSolForMeme(poolKeys, signature, tokenAddress, snipeLaunch);   
    } catch(error) {
        logger.error(error, "Error swapping SOL for Meme");
    }
    
    //const microLamports = 300;
    const json = '{"instructionTypes":[0,1,2,25],"instructions":[{"keys":[{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":true,"isWritable":true},{"pubkey":"QJ6HzTBRpNSpUqpaas2seCAdofTkSrp2RqsaFU4jsjS","isSigner":false,"isWritable":true}],"programId":"11111111111111111111111111111111","data":[3,0,0,0,83,35,10,129,176,229,67,103,255,102,165,235,66,180,96,216,103,45,193,99,29,79,71,204,159,42,24,95,180,146,127,81,32,0,0,0,0,0,0,0,68,81,69,68,49,57,106,111,65,113,97,116,55,107,70,51,56,78,89,114,118,98,100,116,50,89,122,118,72,68,117,66,48,96,46,0,0,0,0,0,165,0,0,0,0,0,0,0,6,221,246,225,215,101,161,147,217,203,225,70,206,235,121,172,28,180,133,237,95,91,55,145,58,140,245,133,126,255,0,169]},{"keys":[{"pubkey":"QJ6HzTBRpNSpUqpaas2seCAdofTkSrp2RqsaFU4jsjS","isSigner":false,"isWritable":true},{"pubkey":"So11111111111111111111111111111111111111112","isSigner":false,"isWritable":false},{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":false,"isWritable":false},{"pubkey":"SysvarRent111111111111111111111111111111111","isSigner":false,"isWritable":false}],"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","data":[1]},{"keys":[{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":true,"isWritable":true},{"pubkey":"2LvWGRYDGoH8sK9VaiJVccSmTp3xqKBTrdiYwNi6fJuL","isSigner":false,"isWritable":true},{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":false,"isWritable":false},{"pubkey":"CaTpzD3cp5cuPxgQpHXhcjuxyij1CYaKKZaWPWexyNik","isSigner":false,"isWritable":false},{"pubkey":"11111111111111111111111111111111","isSigner":false,"isWritable":false},{"pubkey":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","isSigner":false,"isWritable":false}],"programId":"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","data":[]},{"keys":[{"pubkey":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","isSigner":false,"isWritable":false},{"pubkey":"5Ub6QgeTrNn1NXK88TyY3inF5j1zD5DrMKTxjkR7TRVo","isSigner":false,"isWritable":true},{"pubkey":"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","isSigner":false,"isWritable":false},{"pubkey":"8uVEN8ciucXFbm4X38dtT2cAnY5JLUACsWUjS2DZLHfN","isSigner":false,"isWritable":true},{"pubkey":"DANH2Jnvz8LPidUz6tJfUJANudTRyhvAieDpjrtUUswn","isSigner":false,"isWritable":true},{"pubkey":"CiMMYEJCPX54fggj5RJtqotmK5CWRirZrPELK4TXZtF8","isSigner":false,"isWritable":true},{"pubkey":"FUhXjxfoDjxmvqU4Ku8BwKB221bcBMcNZrzbNuxDTYUE","isSigner":false,"isWritable":true},{"pubkey":"srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX","isSigner":false,"isWritable":false},{"pubkey":"7WRXQVGcBQwSE42MzEZJUfa7UVy3dAZXGHBTo6HLNSDP","isSigner":false,"isWritable":true},{"pubkey":"C99QwjCFZwpnEea7Kykp7Fzku71CFo3DYVhc7W9yAU6","isSigner":false,"isWritable":true},{"pubkey":"2fv4g8Qu6VAMC3Pp8qj3mjgAgEvrMZRUp9jzRGJVYV1V","isSigner":false,"isWritable":true},{"pubkey":"6R5n6tDukRdtM8W5yAH6d7S3D1vTZT2wz8DiEcQMwtSb","isSigner":false,"isWritable":true},{"pubkey":"3Tpddj552gYpnCHHXQURLdDhiDcHdPGrEJ21aHzavt4w","isSigner":false,"isWritable":true},{"pubkey":"8KGH341dQ53tayeHvDYcPufR8saf9XxUPSayTX4rjmTg","isSigner":false,"isWritable":true},{"pubkey":"3JwKtepKSz7g7sjjgwH1ax4LwQwFy46KNe5AzvsJLXDY","isSigner":false,"isWritable":false},{"pubkey":"QJ6HzTBRpNSpUqpaas2seCAdofTkSrp2RqsaFU4jsjS","isSigner":false,"isWritable":true},{"pubkey":"2LvWGRYDGoH8sK9VaiJVccSmTp3xqKBTrdiYwNi6fJuL","isSigner":false,"isWritable":true},{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":true,"isWritable":false}],"programId":"675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8","data":[9,64,66,15,0,0,0,0,0,1,0,0,0,0,0,0,0]},{"keys":[{"pubkey":"QJ6HzTBRpNSpUqpaas2seCAdofTkSrp2RqsaFU4jsjS","isSigner":false,"isWritable":true},{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":false,"isWritable":true},{"pubkey":"6bXq74ihb4kw2oNFswmd3AsvvW4f6wsPhftaVJwFMuqa","isSigner":true,"isWritable":false}],"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","data":[9]}],"signers":[],"lookupTableAddress":{}}';
    //const instructions = JSON.parse(json);
    //const instructionsParsed = instructions.instructions;//.splice(1,4);
    //logger.info({"inst1":instructionsParsed},"inst1");
    //const pubKey = new web3.PublicKey("11111111111111111111111111111111");
    //const address = pubKey.toBase58();
    //logger.info({"Address":address},"Address");
    //logger.info({"parsedCount":instructionsParsed.length}, "parsedcount");
    //logger.info({"parsed":instructionsParsed}, "parsed");
    /*for (const ix of instructionsParsed) {
        //if (!isIterable(ix)) {
        //    continue;
        //}
        //logger.info({"instruction":bs58.decode(ix.programId)}, "instruction");
        ix.programId = new web3.PublicKey(ix.programId);
        //const address = ix.programId.toBase58();
        //logger.info({"Address":address},"Address");
        for (const ixk of ix.keys) {
            ixk.pubkey = new web3.PublicKey(ixk.pubkey);
        }
    }*/
    /*for (const ix of instructionsParsed) {
        logger.info({"ix.programId":ix.programId},"ix.programId");
        //getOrInsertDefault(ix.programId).isInvoked = true;
        const address = ix.programId.toBase58();
        logger.info({"Address":address},"Address");
        //for (const accountMeta of ix.keys) {
        //  const keyMeta = getOrInsertDefault(accountMeta.pubkey);
        //  keyMeta.isSigner ||= accountMeta.isSigner;
        //  keyMeta.isWritable ||= accountMeta.isWritable;
        //}
      }*/

    //const units = await getSimulationComputeUnits(config.connection, instructionsParsed, config.wallet.publicKey);
    //logger.info({"Units":units},"Units");
    //instructions.unshift(web3.ComputeBudgetProgram.setComputeUnitPrice(microLamports));
}

async function buildAndSendOptimalTransaction(swapTransaction) {
        //logger.info({"Instructions passed in":swapTransaction}, "Passed in instructions");
        
        // Get optimal priority fees - https://solana.com/developers/guides/advanced/how-to-use-priority-fees
        const microLamports = 300;
        let instructions = new web3.TransactionInstruction();
        instructions = [swapTransaction.instructions];
        
        //const instructionsParsed = JSON.parse(swapTransaction);
        //const instructions = instructionsParsed.instructions;

        //const units = await getSimulationComputeUnits(config.connection, swapTransaction.instructions, config.wallet.publicKey);
        const units = await getSimulationComputeUnits(config.connection, instructions, config.wallet.publicKey);
        logger.info({"Units":units},"Units");

        const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');

        instructions.unshift(web3.ComputeBudgetProgram.setComputeUnitPrice(microLamports));

        if (units) {
            //Add 10% to units to cover cases where the actual cost is more than simulated
            const unitsWithMargin = units + (units * 0.1);
            instructions.unshift(web3.ComputeBudgetProgram.setComputeUnitLimit(unitsWithMargin));
        }

        const transactionMessage = new web3.transactionMessage(instructions, blockhashResponse.blockhash, config.ownerAddress).compileToV0Message(config.addLookupTableInfo);
        logger.info({"Transaction Msg":transactionMessage}, "Transaction Msg");
        const transaction = new web3.VersionedTransaction(transactionMessage, blockhashResponse);
        logger.info({"versioned Transaction":transaction}, "Versioned transaction");
        logger.info("Call Send Optimal Transaction");
        //return yield sendOptimalTransaction(transaction, blockhashResponse);
}

async function swapOnlyAmm(input) {
        //const outputToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3.PublicKey(input.tokenAddress), input.poolKeys.lpDecimals);
        const { innerTransactions } = await raydium.Liquidity.makeSwapInstructionSimple({
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
        return { txids: await (0, buildAndSendOptimalTransaction)(innerTransactions) };
}

async function swapSolForMeme(poolKeys, signature, memeTokenAddr, snipeLaunch) {
        const ownerAddress = config.ownerAddress;
        const inputToken = solToken;
        const inputTokenAmount = new raydium.TokenAmount(inputToken, LAMPORTS_PER_SOL * buyAmtSol);
        const outputToken = new raydium.Token(raydium.TOKEN_PROGRAM_ID, new web3.PublicKey(memeTokenAddr), poolKeys.lpDecimals);
        const slippage = new raydium.Percent(100, 100);
        const walletTokenAccounts = await (0, util.getWalletTokenAccount)(config.connection, config.wallet.publicKey);

        swapOnlyAmm({
            poolKeys,
            tokenAddress: memeTokenAddr, 
            inputTokenAmount,
            slippage,
            walletTokenAccounts,
            wallet: config.wallet,
            outputToken
        });
}

async function simComputeSample() {
    const sendSol = web3.SystemProgram.transfer({
        fromPubkey: config.wallet.publicKey,
        toPubkey: config.wallet.publicKey,
        lamports: 1_000_000,
    });

    logger.info({"sendSOL Instr":sendSol}, "sendSol Instr");

    const units = await getSimulationComputeUnits(
        connection,
        [sendSol],
        config.wallet.publicKey,
    );

    logger.info({"Units":units}, "units");
}

function isIterable(obj) {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
}

class Struct {
    constructor(properties) {
      Object.assign(this, properties);
    }
    encode() {
      return buffer.Buffer.from(borsh.serialize(SOLANA_SCHEMA, this));
    }
    static decode(data) {
      return borsh.deserialize(SOLANA_SCHEMA, this, data);
    }
    static decodeUnchecked(data) {
      return borsh.deserializeUnchecked(SOLANA_SCHEMA, this, data);
    }
  }

function isPublicKeyData(value) {
    return value._bn !== undefined;
}

class PublicKey extends Struct {
    /**
     * Create a new PublicKey object
     * @param value ed25519 public key as buffer or base-58 encoded string
     */
    constructor(value) {
      super({});
      /** @internal */
      this._bn = void 0;
      if (isPublicKeyData(value)) {
        this._bn = value._bn;
      } else {
        if (typeof value === 'string') {
          // assume base 58 encoding by default
          const decoded = bs58__default.default.decode(value);
          if (decoded.length != PUBLIC_KEY_LENGTH) {
            throw new Error(`Invalid public key input`);
          }
          this._bn = new BN__default.default(decoded);
        } else {
          this._bn = new BN__default.default(value);
        }
        if (this._bn.byteLength() > PUBLIC_KEY_LENGTH) {
          throw new Error(`Invalid public key input`);
        }
      }
    }
  
    /**
     * Returns a unique PublicKey for tests and benchmarks using a counter
     */
    static unique() {
      const key = new PublicKey(uniquePublicKeyCounter);
      uniquePublicKeyCounter += 1;
      return new PublicKey(key.toBuffer());
    }
  
    /**
     * Default public key value. The base58-encoded string representation is all ones (as seen below)
     * The underlying BN number is 32 bytes that are all zeros
     */
  
    /**
     * Checks if two publicKeys are equal
     */
    equals(publicKey) {
      return this._bn.eq(publicKey._bn);
    }
  
    /**
     * Return the base-58 representation of the public key
     */
    toBase58() {
      return bs58__default.default.encode(this.toBytes());
    }
    toJSON() {
      return this.toBase58();
    }
  
    /**
     * Return the byte array representation of the public key in big endian
     */
    toBytes() {
      const buf = this.toBuffer();
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  
    /**
     * Return the Buffer representation of the public key in big endian
     */
    toBuffer() {
      const b = this._bn.toArrayLike(buffer.Buffer);
      if (b.length === PUBLIC_KEY_LENGTH) {
        return b;
      }
      const zeroPad = buffer.Buffer.alloc(32);
      b.copy(zeroPad, 32 - b.length);
      return zeroPad;
    }
    get [Symbol.toStringTag]() {
      return `PublicKey(${this.toString()})`;
    }
  
    /**
     * Return the base-58 representation of the public key
     */
    toString() {
      return this.toBase58();
    }
  
    /**
     * Derive a public key from another key, a seed, and a program ID.
     * The program ID will also serve as the owner of the public key, giving
     * it permission to write data to the account.
     */
    /* eslint-disable require-await */
    static async createWithSeed(fromPublicKey, seed, programId) {
      const buffer$1 = buffer.Buffer.concat([fromPublicKey.toBuffer(), buffer.Buffer.from(seed), programId.toBuffer()]);
      const publicKeyBytes = sha256.sha256(buffer$1);
      return new PublicKey(publicKeyBytes);
    }
  
    /**
     * Derive a program address from seeds and a program ID.
     */
    /* eslint-disable require-await */
    static createProgramAddressSync(seeds, programId) {
      let buffer$1 = buffer.Buffer.alloc(0);
      seeds.forEach(function (seed) {
        if (seed.length > MAX_SEED_LENGTH) {
          throw new TypeError(`Max seed length exceeded`);
        }
        buffer$1 = buffer.Buffer.concat([buffer$1, toBuffer(seed)]);
      });
      buffer$1 = buffer.Buffer.concat([buffer$1, programId.toBuffer(), buffer.Buffer.from('ProgramDerivedAddress')]);
      const publicKeyBytes = sha256.sha256(buffer$1);
      if (isOnCurve(publicKeyBytes)) {
        throw new Error(`Invalid seeds, address must fall off the curve`);
      }
      return new PublicKey(publicKeyBytes);
    }
  
    /**
     * Async version of createProgramAddressSync
     * For backwards compatibility
     *
     * @deprecated Use {@link createProgramAddressSync} instead
     */
    /* eslint-disable require-await */
    static async createProgramAddress(seeds, programId) {
      return this.createProgramAddressSync(seeds, programId);
    }
  
    /**
     * Find a valid program address
     *
     * Valid program addresses must fall off the ed25519 curve.  This function
     * iterates a nonce until it finds one that when combined with the seeds
     * results in a valid program address.
     */
    static findProgramAddressSync(seeds, programId) {
      let nonce = 255;
      let address;
      while (nonce != 0) {
        try {
          const seedsWithNonce = seeds.concat(buffer.Buffer.from([nonce]));
          address = this.createProgramAddressSync(seedsWithNonce, programId);
        } catch (err) {
          if (err instanceof TypeError) {
            throw err;
          }
          nonce--;
          continue;
        }
        return [address, nonce];
      }
      throw new Error(`Unable to find a viable program address nonce`);
    }
  
    /**
     * Async version of findProgramAddressSync
     * For backwards compatibility
     *
     * @deprecated Use {@link findProgramAddressSync} instead
     */
    static async findProgramAddress(seeds, programId) {
      return this.findProgramAddressSync(seeds, programId);
    }
  
    /**
     * Check that a pubkey is on the ed25519 curve.
     */
    static isOnCurve(pubkeyData) {
      const pubkey = new PublicKey(pubkeyData);
      return isOnCurve(pubkey.toBytes());
    }
  }
  _PublicKey = PublicKey;
  PublicKey.default = new _PublicKey('11111111111111111111111111111111');
  SOLANA_SCHEMA.set(PublicKey, {
    kind: 'struct',
    fields: [['_bn', 'u256']]
  });

async function recentPrioritizationFee(programAddr) {
    const recentFee = await connection.getRecentPrioritizationFees(programAddr);
    logger.info({"Recent Fee":recentFee}, "Recent Fee");
}

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
    const tokenBalance = await util.getWalletMemeTokenBalance(memeTokenAddr);
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
}

async function checkBlockHash(){
    const START_TIME = new Date();
        // Get Latest Blockhash
    const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;
    let hashExpired = false;

    hashExpired = await util.isBlockhashExpired(connection, lastValidHeight);

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

    //const tokenBalance = await getBalances(tx, poolKeys.baseMint.toString(), config.ownerAddress);
    const tokenBalance = await util.getWalletMemeTokenBalance(memeTokenAddr);
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
    const tokenBalance = await util.getWalletMemeTokenBalance(memeTokenAddr);
    if (tokenBalance !== null){
        logger.info("Token Balance Retrieved");
    } else {
        logger.info("Token Balance Retrieval Error");
    }
    
    const buyPrice = (config.amtBuySol / tokenBalance);
    const solPriceUSD = await util.getSolanaPriceInUSDC();
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

    const poolData = raydium.PoolInfoLayout.decode(accountInfo.data);

    logger.info({"Current SOL Price" : raydium.SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2)});
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
        lpDecoded = await raydium.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
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