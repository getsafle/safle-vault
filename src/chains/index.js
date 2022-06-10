const ethereum = require('@getsafle/vault-eth-controller');
const bsc = require('@getsafle/vault-bsc-controller');
const polygon = require('@getsafle/vault-polygon-controller');
const bitcoin = require('@getsafle/vault-bitcoin-controller');

const evmChains = { 'ethereum': 'ETH', 'binance smart chain': 'BSC', 'polygon': 'MATIC' };
const nonEvmChains = { 'bitcoin': 'BTC' };

module.exports = {
    ethereum,
    bsc,
    polygon,
    bitcoin,
    evmChains,
    nonEvmChains,
}