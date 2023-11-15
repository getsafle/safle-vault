const ethereum = require('@getsafle/vault-eth-controller');
const bsc = require('@getsafle/vault-bsc-controller');
const polygon = require('@getsafle/vault-polygon-controller');
const bitcoin = require('@getsafle/vault-bitcoin-controller');
const optimism = require('@getsafle/vault-optimism-controller');
const arbitrum = require('@getsafle/vault-arbitrum-controller');
const mantle = require('@getsafle/vault-mantle-controller');
const velas = require('@getsafle/vault-velas-controller');
const tezos = require('@getsafle/vault-tezos-controller');

const evmChains = { 'ethereum': 'ETH', 'bsc': 'BSC', 'polygon': 'MATIC', 'optimism': 'OP' ,'arbitrum': 'ARB', 'mantle': 'MNT', 'velas': 'VLX' };
const nonEvmChains = { 'bitcoin': 'BTC', 'tezos': 'XTZ' };

module.exports = {
    ethereum,
    bsc,
    polygon,
    bitcoin,
    optimism,
    arbitrum,
    mantle,
    velas,
    tezos,
    evmChains,
    nonEvmChains,
}