const bs58 = require('bs58');
"use strict";
const dotenv = require('dotenv').config({ path: `${__dirname}/../.env` });
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOKEN = exports.solToken = exports.addLookupTableInfo = exports.makeTxVersion = exports.RAYDIUM_MAINNET_API = exports.ENDPOINT = exports.PROGRAMIDS = exports.connection = exports.wallet = exports.rpcToken = exports.rpcUrl = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");

exports.ownerAddress = process.env.WALLET_ADDRESS; //wallet address - public key
exports.wallet = web3_js_1.Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY)); //wallet private key
exports.connection = new web3_js_1.Connection(process.env.RPC_URL); //RPC connection URL
exports.websocketConnection = process.env.WS_URL; //web socket connection URL
exports.amtBuySol = '0.001'; //INTEGER AMOUNT OF SOL TO USE PER SWAP, EX. 0.001
exports.PROGRAMIDS = raydium_sdk_1.MAINNET_PROGRAM_ID;
exports.ENDPOINT = raydium_sdk_1.ENDPOINT;
exports.RAYDIUM_MAINNET_API = raydium_sdk_1.RAYDIUM_MAINNET;
exports.makeTxVersion = raydium_sdk_1.TxVersion.V0; // LEGACY
exports.addLookupTableInfo = raydium_sdk_1.LOOKUP_TABLE_CACHE;
exports.solToken = new raydium_sdk_1.Token(raydium_sdk_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'); // WSOL