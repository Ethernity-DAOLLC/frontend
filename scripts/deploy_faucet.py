"""
Script de deploy para MockUSDC y USDCFaucet usando web3.py
Requisitos: pip install web3 python-dotenv
"""

from web3 import Web3
from eth_account import Account
import json
import os
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# ==========================================
# CONFIGURACIÓN
# ==========================================

# RPC URLs
NETWORKS = {
    'sepolia': {
        'rpc': 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
        'chain_id': 11155111,
        'explorer': 'https://sepolia.etherscan.io',
        'name': 'Sepolia'
    },
    'arbitrum_sepolia': {
        'rpc': 'https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
        'chain_id': 421614,
        'explorer': 'https://sepolia.arbiscan.io',
        'name': 'Arbitrum Sepolia'
    }
}

# Parámetros del Faucet
CLAIM_AMOUNT = 1000 * 10**6  # 1000 USDC (6 decimales)
COOLDOWN_TIME = 82800  # 23 horas en segundos
INITIAL_FUNDING = 100_000 * 10**6  # 100,000 USDC

# ==========================================
# ABIs DE LOS CONTRATOS
# ==========================================

MOCK_USDC_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{"name": "minter", "type": "address"}],
        "name": "addMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "mintTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "minter", "type": "address"}],
        "name": "isMinter",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

FAUCET_ABI = [
    {
        "inputs": [
            {"name": "_usdc", "type": "address"},
            {"name": "_claimAmount", "type": "uint256"},
            {"name": "_cooldownTime", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimAmount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "cooldownTime",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getFaucetBalance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "usdc",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# ==========================================
# BYTECODE DE LOS CONTRATOS
# ==========================================
# NOTA: Debes compilar los contratos y obtener el bytecode
# Puedes usar solc-select y solc para compilar:
# solc --bin MockUSDC.sol
# O usar Remix y copiar el bytecode

# Placeholder - DEBES REEMPLAZAR CON TU BYTECODE REAL
MOCK_USDC_BYTECODE = "0x608060..."  # Compilar MockUSDC.sol
FAUCET_BYTECODE = "0x608060..."     # Compilar USDCFaucet.sol

# ==========================================
# FUNCIONES AUXILIARES
# ==========================================

def print_header(text):
    """Imprime un header decorado"""
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50 + "\n")

def print_success(text):
    """Imprime mensaje de éxito"""
    print(f"✅ {text}")

def print_info(text):
    """Imprime información"""
    print(f"📝 {text}")

def print_error(text):
    """Imprime error"""
    print(f"❌ {text}")

def wait_for_transaction(w3, tx_hash, description="Transaction"):
    """Espera confirmación de transacción"""
    print(f"⏳ Waiting for {description}...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt.status == 1:
        print_success(f"{description} confirmed!")
        print(f"   Gas used: {receipt.gasUsed}")
        return receipt
    else:
        print_error(f"{description} failed!")
        return None

# ==========================================
# FUNCIÓN PRINCIPAL DE DEPLOY
# ==========================================

def deploy_faucet_system(network_name='sepolia'):
    """
    Deploya el sistema completo de Faucet USDC
    
    Args:
        network_name: 'sepolia' o 'arbitrum_sepolia'
    """
    
    print_header(f"🚀 DEPLOYING USDC FAUCET SYSTEM")
    
    # Obtener configuración de red
    if network_name not in NETWORKS:
        print_error(f"Network {network_name} not found!")
        return None
    
    network = NETWORKS[network_name]
    print_info(f"Network: {network['name']}")
    print_info(f"Chain ID: {network['chain_id']}")
    
    # Conectar a la red
    w3 = Web3(Web3.HTTPProvider(network['rpc']))
    
    if not w3.is_connected():
        print_error("Failed to connect to network!")
        return None
    
    print_success("Connected to network")
    
    # Cargar cuenta del deployer
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print_error("PRIVATE_KEY not found in .env file!")
        return None
    
    account = Account.from_key(private_key)
    deployer_address = account.address
    
    print_info(f"Deployer address: {deployer_address}")
    
    # Verificar balance
    balance = w3.eth.get_balance(deployer_address)
    balance_eth = w3.from_wei(balance, 'ether')
    print_info(f"Deployer balance: {balance_eth} ETH")
    
    if balance_eth < 0.01:
        print_error("Insufficient balance! Need at least 0.01 ETH")
        return None
    
    # ==========================================
    # 1. DEPLOY MOCKUSDC
    # ==========================================
    print_header("📝 Deploying MockUSDC")
    
    MockUSDC = w3.eth.contract(abi=MOCK_USDC_ABI, bytecode=MOCK_USDC_BYTECODE)
    
    # Construir transacción de deploy
    nonce = w3.eth.get_transaction_count(deployer_address)
    
    construct_txn = MockUSDC.constructor().build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price,
        'chainId': network['chain_id']
    })
    
    # Firmar y enviar
    signed_txn = account.sign_transaction(construct_txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    
    print_info(f"Transaction hash: {tx_hash.hex()}")
    
    receipt = wait_for_transaction(w3, tx_hash, "MockUSDC deployment")
    if not receipt:
        return None
    
    mock_usdc_address = receipt.contractAddress
    print_success(f"MockUSDC deployed at: {mock_usdc_address}")
    
    # Crear instancia del contrato
    mock_usdc = w3.eth.contract(address=mock_usdc_address, abi=MOCK_USDC_ABI)
    
    # Verificar deploy
    symbol = mock_usdc.functions.symbol().call()
    decimals = mock_usdc.functions.decimals().call()
    print_info(f"Token: {symbol} (decimals: {decimals})")
    
    # ==========================================
    # 2. DEPLOY FAUCET
    # ==========================================
    print_header("📝 Deploying USDCFaucet")
    
    Faucet = w3.eth.contract(abi=FAUCET_ABI, bytecode=FAUCET_BYTECODE)
    
    nonce = w3.eth.get_transaction_count(deployer_address)
    
    construct_txn = Faucet.constructor(
        mock_usdc_address,
        CLAIM_AMOUNT,
        COOLDOWN_TIME
    ).build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 3000000,
        'gasPrice': w3.eth.gas_price,
        'chainId': network['chain_id']
    })
    
    signed_txn = account.sign_transaction(construct_txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    
    print_info(f"Transaction hash: {tx_hash.hex()}")
    
    receipt = wait_for_transaction(w3, tx_hash, "USDCFaucet deployment")
    if not receipt:
        return None
    
    faucet_address = receipt.contractAddress
    print_success(f"USDCFaucet deployed at: {faucet_address}")
    
    # Crear instancia del contrato
    faucet = w3.eth.contract(address=faucet_address, abi=FAUCET_ABI)
    
    # Verificar configuración
    claim_amount = faucet.functions.claimAmount().call()
    cooldown = faucet.functions.cooldownTime().call()
    print_info(f"Claim amount: {claim_amount / 10**6} USDC")
    print_info(f"Cooldown: {cooldown / 3600} hours")
    
    # ==========================================
    # 3. CONFIGURAR PERMISOS
    # ==========================================
    print_header("⚙️  Configuring Permissions")
    
    print_info("Adding Faucet as minter...")
    
    nonce = w3.eth.get_transaction_count(deployer_address)
    
    txn = mock_usdc.functions.addMinter(faucet_address).build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'chainId': network['chain_id']
    })
    
    signed_txn = account.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    
    receipt = wait_for_transaction(w3, tx_hash, "addMinter")
    if not receipt:
        return None
    
    # Verificar
    is_minter = mock_usdc.functions.isMinter(faucet_address).call()
    if is_minter:
        print_success("Faucet is now a minter!")
    else:
        print_error("Failed to set Faucet as minter")
        return None
    
    # ==========================================
    # 4. FINANCIAR FAUCET
    # ==========================================
    print_header("💰 Funding the Faucet")
    
    print_info(f"Minting {INITIAL_FUNDING / 10**6} USDC to Faucet...")
    
    nonce = w3.eth.get_transaction_count(deployer_address)
    
    txn = mock_usdc.functions.mintTo(
        faucet_address,
        INITIAL_FUNDING
    ).build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 150000,
        'gasPrice': w3.eth.gas_price,
        'chainId': network['chain_id']
    })
    
    signed_txn = account.sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    
    receipt = wait_for_transaction(w3, tx_hash, "mintTo")
    if not receipt:
        return None
    
    # Verificar balance
    faucet_balance = faucet.functions.getFaucetBalance().call()
    print_success(f"Faucet balance: {faucet_balance / 10**6} USDC")
    
    # ==========================================
    # 5. RESUMEN FINAL
    # ==========================================
    print_header("✅ DEPLOYMENT COMPLETE!")
    
    deployment_info = {
        'network': network['name'],
        'chain_id': network['chain_id'],
        'deployer': deployer_address,
        'mockUSDC': mock_usdc_address,
        'faucet': faucet_address,
        'claimAmount': CLAIM_AMOUNT,
        'cooldownTime': COOLDOWN_TIME,
        'initialFunding': INITIAL_FUNDING,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n📋 Contract Addresses:")
    print(f"   MockUSDC: {mock_usdc_address}")
    print(f"   USDCFaucet: {faucet_address}")
    
    print("\n🔗 Block Explorer URLs:")
    print(f"   MockUSDC: {network['explorer']}/address/{mock_usdc_address}")
    print(f"   USDCFaucet: {network['explorer']}/address/{faucet_address}")
    
    print("\n📝 Update frontend config:")
    print("="*50)
    print(f"""
const FAUCET_CONFIG: Record<number, {{ faucet: `0x${{string}}`; usdc: `0x${{string}}` }}> = {{
  {network['chain_id']}: {{
    faucet: '{faucet_address}',
    usdc: '{mock_usdc_address}',
  }},
}};
    """)
    
    # Guardar información de deployment
    filename = f"deployment_{network_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\n💾 Deployment info saved to: {filename}")
    
    return deployment_info

# ==========================================
# FUNCIÓN PARA VERIFICAR DEPLOYMENT
# ==========================================

def verify_deployment(network_name, mock_usdc_address, faucet_address):
    """
    Verifica que el deployment se hizo correctamente
    """
    print_header("🔍 Verifying Deployment")
    
    network = NETWORKS[network_name]
    w3 = Web3(Web3.HTTPProvider(network['rpc']))
    
    if not w3.is_connected():
        print_error("Failed to connect!")
        return False
    
    # Verificar MockUSDC
    mock_usdc = w3.eth.contract(address=mock_usdc_address, abi=MOCK_USDC_ABI)
    
    try:
        symbol = mock_usdc.functions.symbol().call()
        decimals = mock_usdc.functions.decimals().call()
        is_minter = mock_usdc.functions.isMinter(faucet_address).call()
        
        print_success(f"MockUSDC: {symbol} ({decimals} decimals)")
        print_success(f"Faucet is minter: {is_minter}")
    except Exception as e:
        print_error(f"MockUSDC verification failed: {e}")
        return False
    
    # Verificar Faucet
    faucet = w3.eth.contract(address=faucet_address, abi=FAUCET_ABI)
    
    try:
        usdc_addr = faucet.functions.usdc().call()
        claim_amount = faucet.functions.claimAmount().call()
        cooldown = faucet.functions.cooldownTime().call()
        balance = faucet.functions.getFaucetBalance().call()
        
        print_success(f"Faucet USDC: {usdc_addr}")
        print_success(f"Claim amount: {claim_amount / 10**6} USDC")
        print_success(f"Cooldown: {cooldown / 3600} hours")
        print_success(f"Balance: {balance / 10**6} USDC")
        
        if usdc_addr.lower() != mock_usdc_address.lower():
            print_error("USDC address mismatch!")
            return False
        
    except Exception as e:
        print_error(f"Faucet verification failed: {e}")
        return False
    
    print_success("All checks passed!")
    return True

# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    import sys
    
    # Usar el primer argumento como network, default 'sepolia'
    network = sys.argv[1] if len(sys.argv) > 1 else 'sepolia'
    
    print(f"""
╔══════════════════════════════════════════════════════╗
║                                                      ║
║        USDC FAUCET DEPLOYMENT SCRIPT                 ║
║        for Ethernity DAO                             ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
    """)
    
    # Deploy
    result = deploy_faucet_system(network)
    
    if result:
        print("\n🎉 Deployment successful!")
        print("\n📚 Next steps:")
        print("1. Verify contracts on block explorer")
        print("2. Update FAUCET_CONFIG in USDCFaucet.tsx")
        print("3. Test claiming from frontend")
    else:
        print("\n❌ Deployment failed!")
        sys.exit(1)