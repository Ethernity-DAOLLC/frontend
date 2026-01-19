# Ethernity DAO - Frontend

## 📋 Descripción

Frontend de Ethernity DAO, una plataforma descentralizada para la gestión de fondos de retiro con gobernanza DAO. Permite a los usuarios crear contratos de ahorro personalizados con control absoluto sobre su dinero y futuro financiero, participar en votaciones y administrar sus inversiones de manera transparente en blockchain.

## 🚀 Stack Tecnológico

### Core
- **React 19.0.0** - Biblioteca principal de UI
- **TypeScript 5.6.0** - Tipado estático
- **Vite 5.4.0** - Build tool y dev server

### Blockchain & Web3
- **Wagmi 2.19.2** - React hooks para Ethereum
- **Viem 2.38.6** - Cliente TypeScript para Ethereum
- **@wagmi/connectors 6.1.3** - Conectores de wallets
- **@reown/appkit: 1.8.14**
  **@reown/appkit-adapter-wagmi": 1.8.14**

### Routing & State
- **React Router DOM 7.9.5** - Navegación SPA
- **@tanstack/react-query 5.90.6** - Gestión de estado asíncrono

### UI & Styling
- **Tailwind CSS 3.4.0** - Framework CSS utility-first
- **Lucide React 0.552.0** - Iconos
- **Chart.js 4.5.1** - Gráficos y visualizaciones
- **React Chartjs 2 5.3.1** - Wrapper de Chart.js para React

### Desarrollo
- **ESLint 8.57.0** - Linter
- **PostCSS 8.4.0** - Transformaciones CSS
- **Autoprefixer 10.4.0** - Prefijos CSS automáticos

## 📁 Estructura del Proyecto

```
frontend/
│
├── public/                          # Archivos públicos estáticos
│
├── src/
│   ├── assets/                      # Recursos (imágenes, iconos)
│   │   └── ethernity.ico
│   │
│   ├── components/                  # Componentes reutilizables
│   │   ├── common/                  # Componentes comunes
│   │   │   └── LoadingScreen.tsx
│   │   ├── layout/                  # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── wallet/                  # Componentes de wallet
│   │       └── CustomWalletModal.tsx
│   │
│   ├── context/                     # Context providers
│   │   ├── AuthContext.tsx          # Autenticación
│   │   └── RetirementContext.tsx    # Estado de planes de retiro
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── web3/                    # Hooks de Web3
│   │   │   └── useWallet.ts
│   │   └── useEthernityDAO.ts       # Hook principal del DAO
│   │
│   ├── pages/                       # Páginas de la aplicación
│   │   ├── Public/                  # Páginas públicas
│   │   │   ├── HomePage.tsx
│   │   │   ├── CalculatorPage.tsx
│   │   │   └── ContactPage.tsx
│   │   ├── User/                    # Páginas de usuario
│   │   │   ├── DashboardPage.tsx
│   │   │   └── CreateContractPage.tsx
│   │   └── Admin/                   # Páginas de administración
│   │       ├── AdminDashboard.tsx
│   │       ├── ContactMessages.tsx
│   │       ├── ContractsManagement.tsx
│   │       ├── GovernanceManagement.tsx
│   │       ├── TokenManagement.tsx
│   │       └── TreasuryManagement.tsx
│   │
│   ├── utils/                       # Utilidades
│   │   ├── formatters.ts            # Formateo de datos
│   │   ├── validators.ts            # Validaciones
│   │   ├── validateEnv.ts           # Validación de env vars
│   │   └── index.ts
│   │
│   ├── App.tsx                      # Componente principal
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Estilos globales
│   └── vite-env.d.ts               # Tipos de Vite
│
├── index.html                       # HTML base
├── package.json                     # Dependencias
├── tsconfig.json                    # Configuración TypeScript
├── tsconfig.node.json              # TS config para Node
├── vite.config.ts                  # Configuración Vite
├── tailwind.config.js              # Configuración Tailwind
├── postcss.config.js               # Configuración PostCSS
├── vercel.json                     # Deploy config
├── .gitignore                      # Archivos ignorados
└── README.md                       # Este archivo
```

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Direcciones de Contratos (Requeridas)
VITE_TOKEN_ADDRESS=0x...
VITE_TREASURY_ADDRESS=0x...
VITE_GOVERNANCE_ADDRESS=0x...
VITE_FACTORY_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...

# Admin
VITE_ADMIN_ADDRESS=0x...

# Chain ID (opcional, default: Arbitrum Sepolia)
VITE_CHAIN_ID=421614

# RPC URLs (opcional)
VITE_ARBITRUM_SEPOLIA_RPC=https://...
VITE_SEPOLIA_RPC=https://...
VITE_ZKSYNC_SEPOLIA_RPC=https://...

# API (opcional, default: http://localhost:4000)
VITE_API_URL=http://localhost:4000
```

### Redes Soportadas

- **Arbitrum Sepolia** (Chain ID: 421614) - Red principal
- **Sepolia** (Chain ID: 11155111)
- **zkSync Sepolia** (Chain ID: 300)

## 🚦 Instalación y Ejecución

### Prerrequisitos

- Node.js >= 18.x
- pnpm >= 8.x (recomendado) o npm/yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Navegar al directorio
cd apps/frontend

# Instalar dependencias
pnpm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 3000)
pnpm dev
```

### Build

```bash
# Build de producción
pnpm build

# Build sin verificación de tipos (más rápido)
pnpm build:skip-types
```

### Preview

```bash
# Vista previa del build
pnpm preview
```

### Linting

```bash
# Ejecutar ESLint
pnpm lint
```

## 🎨 Características Principales

### Sistema de Rutas

- **Públicas**: `/`, `/calculator`, `/contact`
- **Usuario**: `/dashboard`, `/create-contract`
- **Admin**: `/admin/*` (requiere privilegios)

### Protección de Rutas

- **ProtectedRoute**: Verifica conexión de wallet
- **Admin Routes**: Verifica dirección de administrador

### Contextos Globales

1. **AuthContext**: Gestión de autenticación y modales
2. **RetirementContext**: Estado de cálculos de retiro

### Custom Hooks

- `useWallet`: Gestión de wallet y conexión
- `useEthernityDAO`: Interacción con contratos
- `useContractAddresses`: Direcciones de contratos

## 🎯 Componentes Clave

### Layout
- **Navbar**: Navegación principal con conexión de wallet
- **Footer**: Información de copyright y links

### Common
- **LoadingScreen**: Pantalla de carga global

### Wallet
- **CustomWalletModal**: Modal personalizado de conexión

## 🔐 Seguridad

- Validación de variables de entorno en producción
- Verificación de direcciones de administrador
- Protección de rutas sensibles
- Validación de formularios con tipos estrictos

## 📦 Build & Deploy

### Vercel

Configurado en `vercel.json` para deploy automático:

```json
{
  "buildCommand": "cd apps/frontend && pnpm run build",
  "outputDirectory": "apps/frontend/dist",
  "framework": "vite"
}
```

### Optimizaciones

- Code splitting automático
- Lazy loading de páginas
- Optimización de assets
- Tree shaking
- Compresión de imágenes

## 🎨 Design System

### Colores

```css
--forest-green: #1B5E20
--dark-blue: #1f2937
--gold: #8a7d07ef
```

### Gradientes

- `gradient-primary`: Dark blue → Forest green
- `gradient-gold`: Yellow → Gold

### Componentes CSS

- `.btn`: Botones base
- `.btn-primary`, `.btn-secondary`, `.btn-gold`: Variantes
- `.card`: Tarjetas
- `.input`: Campos de formulario
- `.badge`: Badges con variantes (success, warning, error)

## 📝 Utilidades

### Formatters

- `formatCurrency()`: Formato de moneda
- `formatUSDC()`: Formato específico USDC
- `formatNumber()`: Formato numérico
- `formatPercentage()`: Porcentajes
- `formatTimestamp()`: Fechas y horas
- `formatAddress()`: Direcciones Ethereum (0x...)
- `parseUSDC()`: Parse a formato USDC

### Validators

- `validateAge()`: Validación de edad
- `validateRetirementAge()`: Edad de retiro
- `validateAmount()`: Montos
- `validateInterestRate()`: Tasas de interés

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a Ethernity DAO.

---

**Desarrollado por el equipo de Ethernity DAO**