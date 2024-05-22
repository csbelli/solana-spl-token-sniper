# Strategy2 - Solana SPL Token Sniper
This section outlines the operational flow of `strategy2` implemented in the `start2.js` file, part of the Solana SPL Token Sniper project.
This script is designed to monitor and interact with specific transactions on the Solana blockchain, particularly those involving a specified program, and perform actions based on the transactions' characteristics and outcomes.

## Flow Diagram

Below is the flow diagram for `start2.js`:

+----------------+     +----------------+     +----------------+ 
| WebSocket Open | --> | Send Subscribe | --> | Receive Message| 
+----------------+     +----------------+     +----------------+ 
                                                      |         
                                                      v         
                                              +----------------+      +----------------+
                                              | Parse Txs      | <--> | Parse Logs     |
                                              +----------------+      +----------------+
                                                      |                       |
                                                      v                       v
                                              +----------------+      +----------------+
                                              | Parse Account  |      | Close WebSocket|
                                              | Keys           |      | if conditions  |
                                              |                |      | are met        |
                                              +----------------+      +----------------+
                                                      |
                                                      v
                                              +----------------+ 
                                              | SWAP.swap()    | 
                                              |                | 
                                              +----------------+

## Description of the Flow

1. **WebSocket Open**: 
    - Establishes a WebSocket connection to the Solana blockchain using the URL provided in the configuration file.

2. **Send Subscribe**: Upon opening the connection, a subscription message is sent to listen for blocks that mention a specific account or program.

3. **Receive Message**: Receives a message from the WebSocket, which contains the transaction details.
    - When a message (block data) is received over the WebSocket, it is converted from a buffer to a UTF-8 string.
    - The string is then parsed into JSON format and passed to the function `parseTxs`.

4. **Parse Txs**: Parses the transaction details and performs actions based on the transaction's characteristics and outcomes.
    - The function checks if the params field is present in the received JSON. If not, it logs an error and exits.
    - It extracts transactions from the block and iterates over each transaction.
    - For each transaction, it calls `parseLogs` and checks specific conditions (e.g., number of account keys and instructions).
    - If conditions are met, it logs the transaction signatures, closes the WebSocket, and calls `parseAccountKeys`.

5. **Parse Account keys**: Parses the account keys and performs actions based on the account keys' characteristics and outcomes.
    - This function iterates over account keys involved in the transaction.
    - For each key, it retrieves account information from the Solana network.
    - If the account data matches specific criteria (e.g., data length), it identifies the market ID and retrieves related pool keys.
    - If the marketID is found:
        - It verifies the token has "mint authority revoked".
        - It calls `derivePoolKeys.derivePoolKeys` to derive the poolKeys.
        - It calls `swap2.swap` to initiate the swap.

<!-- Divider -->


This section outlines the operational flow of `strategy2` implemented in the `swap2.js` file, part of the Solana SPL Token Sniper project. The strategy involves swapping tokens on the Solana blockchain using the Raydium SDK and monitoring the token prices post-swap.

## Flow Diagram

Below is the flow diagram for `swap2.js`:

+-------------------+          +-------------------+          +---------------------+
|                   |          |                   |          |                     |
| swap(poolKeys,    |          | swapOnlyAmm(...)  |          | buildAndSendTx(...) |
| signature)        +--------->+                   +--------->+                     |
|                   |          |                   |          |                     |
+-------------------+          +-------------------+          +---------+-----------+
                                                                        |
                                                                        |
                                                                        v
                                                              +---------+-----------+
                                                              |                     |
                                                              | monitorTokenSell    |
                                                              |                     |
                                                              +---------+-----------+
                                                                        |
                                                                        |
                                                                        v
                                                              +---------+-----------+
                                                              |                     |
                                                              | monitorToken(...)   |
                                                              |                     |
                                                              +---------+-----------+
                                                                        |
                                                                        |
                                                                        v
                                                              +---------+-----------+
                                                              |                     |
                                                              | getTokenPriceInSol  |
                                                              |                     |
                                                              +---------+-----------+

## Description of the Flow

1. **swap(poolKeys, signature)**: Initiates the swap process by preparing the input token and amount, setting slippage, and retrieving wallet token accounts. It then calls `swapOnlyAmm`.

2. **swapOnlyAmm(...)**: Handles the actual swap logic using Raydium SDK's `makeSwapInstructionSimple`. Constructs the swap instruction and then calls `buildAndSendTx` to execute the transaction.

3. **buildAndSendTx(...)**: Builds and sends the transaction to the Solana blockchain and returns the transaction IDs.

4. **monitorTokenSell(...)**: Triggered after a successful swap, this function monitors the token sale by fetching the token balance and calculating the buy price. It then calls `monitorToken`.

5. **monitorToken(...)**: Periodically checks the token price against the buy price to determine the percentage increase or decrease.

6. **getTokenPriceInSol(...)**: Fetches the current token price in SOL by querying the Solana blockchain for account balances in the specified vaults.

This flow represents the sequence of operations starting from initiating a swap to monitoring the token price post-swap.