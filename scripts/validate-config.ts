// scripts/validate-config.ts
// Script para validar la configuración antes de deploy

import { appConfig, validateConfig, getContractAddress } from '../src/config';

console.log('\n🔍 Validating Ethernity DAO Configuration...\n');

// Información general
console.log('📋 General Configuration:');
console.log(`   Environment: ${appConfig.env}`);
console.log(`   API URL: ${appConfig.apiUrl}`);
console.log('');

// Información de la chain
console.log('⛓️  Chain Configuration:');
console.log(`   Chain ID: ${appConfig.chain.id}`);
console.log(`   Chain Name: ${appConfig.chain.name}`);
console.log(`   Network Type: ${appConfig.chain.isTestnet ? 'Testnet' : 'Mainnet'}`);
console.log(`   Explorer: ${appConfig.chain.explorerUrl}`);
if (appConfig.chain.faucetUrl) {
  console.log(`   Faucet: ${appConfig.chain.faucetUrl}`);
}
console.log('');

// Validar contratos
console.log('📝 Contract Addresses:');
const contracts = [
  'personalFundFactory',
  'usdc',
  'treasury',
  'governance',
  'token',
  'protocolRegistry',
  'userPreferences',
] as const;

let hasErrors = false;

contracts.forEach(contract => {
  try {
    const address = getContractAddress(contract);
    console.log(`   ✅ ${contract}: ${address}`);
  } catch (error) {
    if (contract === 'protocolRegistry' || contract === 'userPreferences') {
      console.log(`   ⚠️  ${contract}: Not configured (optional)`);
    } else {
      console.log(`   ❌ ${contract}: MISSING`);
      hasErrors = true;
    }
  }
});
console.log('');

// Validación completa
const validation = validateConfig();

if (validation.valid) {
  console.log('✅ Configuration is valid!\n');
  process.exit(0);
} else {
  console.log('❌ Configuration has errors:\n');
  validation.errors.forEach(error => {
    console.log(`   - ${error}`);
  });
  console.log('\n💡 Please check your .env.local file\n');
  process.exit(1);
}