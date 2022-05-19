const ethereum = require('@getsafle/vault-eth-controller');
const bsc = require('@getsafle/vault-bsc-controller');
const polygon = require('@getsafle/vault-polygon-controller');
const bitcoin = require('@getsafle/vault-bitcoin-controller');
const harmony = require('@getsafle/vault-harmony-controller');
const avalanche = require('@getsafle/vault-avalanche-controller');
const velas = require('@getsafle/vault-velas-controller');
const solana = require('@getsafle/vault-solana-controller');

const evmChains = { 'ethereum': 'ETH', 'binance smart chain': 'BSC', 'polygon': 'MATIC', 'harmony': 'ONE', 'avalanche': 'AVAX', 'velas': 'VLX' };
const nonEvmChains = { 'bitcoin': 'BTC', 'solana': 'SOL' };

module.exports = {
    ethereum,
    bsc,
    polygon,
    bitcoin,
    evmChains,
    nonEvmChains,
    harmony,
    avalanche,
    velas,
    solana,
}