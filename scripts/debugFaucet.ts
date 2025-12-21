console.log('🔧 === DIAGNÓSTICO DEL FAUCET ===\n');

console.log('📋 Variables de entorno:');
console.log('VITE_FAUCET_API_URL:', import.meta.env.VITE_FAUCET_API_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('PROD:', import.meta.env.PROD);
console.log('\n');

const faucetUrl = 'https://usdc-faucet-production.up.railway.app';

console.log('📡 Probando conexión al backend...');
console.log('URL:', faucetUrl);

async function testHealth() {
  try {
    console.log('\n🧪 Test 1: Health Check');
    const response = await fetch(`${faucetUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    
    const data = await response.json();
    console.log('✅ Health response:', data);
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}
async function testCORS() {
  try {
    console.log('\n🧪 Test 2: CORS Check');
    const response = await fetch(`${faucetUrl}/health`, {
      method: 'OPTIONS',
    });
    
    console.log('Status:', response.status);
    console.log('CORS headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
    
    return true;
  } catch (error) {
    console.error('❌ CORS check failed:', error);
    return false;
  }
}
async function testRequestTokens() {
  try {
    console.log('\n🧪 Test 3: Request Tokens Endpoint');
    
    const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e6a5Ae823A';
    
    const response = await fetch(`${faucetUrl}/api/request-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: testWallet,
        current_age: 30,
        retirement_age: 65,
        desired_monthly_payment: 3000,
        monthly_deposit: 500,
        initial_amount: 10000,
      }),
    });
    
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (!response.ok) {
      console.warn('⚠️ Request failed:', data);
    } else {
      console.log('✅ Request successful');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Request tokens failed:', error);
    return false;
  }
}
async function runAllTests() {
  console.log('\n🚀 Iniciando diagnóstico completo...\n');
  
  const healthOk = await testHealth();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const corsOk = await testCORS();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (healthOk) {
    await testRequestTokens();
  }
  
  console.log('\n✅ === DIAGNÓSTICO COMPLETADO ===');
  console.log('\nSi todos los tests pasaron pero el botón falla:');
  console.log('1. Verifica que reiniciaste el frontend después de cambiar .env');
  console.log('2. Limpia la caché del navegador (Ctrl+Shift+Delete)');
  console.log('3. Verifica la consola de Network tab (F12 → Network)');
}
runAllTests();