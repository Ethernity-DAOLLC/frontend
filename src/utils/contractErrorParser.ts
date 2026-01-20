interface ParsedError {
  message: string;
  reason?: string;
  code?: string;
  isUserRejection: boolean;
  isContractRevert: boolean;
  rawError?: any;
}

export function parseContractError(error: any): ParsedError {

  if (
    error?.message?.includes('User rejected') ||
    error?.message?.includes('User denied') ||
    error?.code === 'ACTION_REJECTED' ||
    error?.code === 4001
  ) {
    return {
      message: 'Transacción rechazada por el usuario',
      code: 'USER_REJECTED',
      isUserRejection: true,
      isContractRevert: false,
      rawError: error,
    };
  }

  const revertReasons = extractRevertReason(error);
  if (revertReasons.length > 0) {
    return {
      message: getFriendlyMessage(revertReasons[0]),
      reason: revertReasons[0],
      code: 'CONTRACT_REVERT',
      isUserRejection: false,
      isContractRevert: true,
      rawError: error,
    };
  }

  if (
    error?.message?.includes('insufficient funds') ||
    error?.message?.includes('gas required exceeds')
  ) {
    return {
      message: 'Fondos insuficientes para pagar el gas',
      code: 'INSUFFICIENT_GAS',
      isUserRejection: false,
      isContractRevert: false,
      rawError: error,
    };
  }

  if (
    error?.message?.includes('ERC20: insufficient allowance') ||
    error?.message?.includes('allowance')
  ) {
    return {
      message: 'Aprobación de USDC insuficiente',
      code: 'INSUFFICIENT_ALLOWANCE',
      isUserRejection: false,
      isContractRevert: true,
      rawError: error,
    };
  }

  if (
    error?.message?.includes('ERC20: transfer amount exceeds balance') ||
    error?.message?.includes('insufficient balance')
  ) {
    return {
      message: 'Balance de USDC insuficiente',
      code: 'INSUFFICIENT_BALANCE',
      isUserRejection: false,
      isContractRevert: true,
      rawError: error,
    };
  }

  return {
    message: error?.shortMessage || error?.message || 'Error desconocido en la transacción',
    code: 'UNKNOWN_ERROR',
    isUserRejection: false,
    isContractRevert: false,
    rawError: error,
  };
}

function extractRevertReason(error: any): string[] {
  const reasons: string[] = [];
  if (error?.reason) {
    reasons.push(error.reason);
  }
  if (error?.data?.message) {
    reasons.push(error.data.message);
  }
  if (error?.message) {
    const revertMatch = error.message.match(/reverted with reason string '(.+?)'/);
    if (revertMatch && revertMatch[1]) {
      reasons.push(revertMatch[1]);
    }

    const customErrorMatch = error.message.match(/reverted with custom error '(.+?)'/);
    if (customErrorMatch && customErrorMatch[1]) {
      reasons.push(customErrorMatch[1]);
    }

    const commonErrors = [
      'User already has a fund',
      'Principal below minimum',
      'Principal above maximum',
      'Monthly deposit below minimum',
      'Current age below minimum',
      'Current age above maximum',
      'Retirement age below minimum',
      'Timelock years below minimum',
      'Timelock years above maximum',
      'Insufficient USDC balance',
      'USDC transfer failed',
    ];

    for (const commonError of commonErrors) {
      if (error.message.includes(commonError)) {
        reasons.push(commonError);
        break;
      }
    }
  }

  if (error?.error?.data) {
    try {
      const decoded = JSON.parse(error.error.data);
      if (decoded?.message) {
        reasons.push(decoded.message);
      }
    } catch {
      // Ignorar errores de parseo
    }
  }

  return reasons;
}

function getFriendlyMessage(revertReason: string): string {
  const friendlyMessages: Record<string, string> = {
    'User already has a fund': 'Ya tienes un fondo de retiro creado. Solo puedes tener uno por wallet.',
    'Principal below minimum': 'El principal es inferior al mínimo permitido por el contrato.',
    'Principal above maximum': 'El principal excede el máximo permitido por el contrato.',
    'Monthly deposit below minimum': 'El depósito mensual es inferior al mínimo permitido.',
    'Current age below minimum': 'La edad actual es menor a la edad mínima permitida.',
    'Current age above maximum': 'La edad actual es mayor a la edad máxima permitida.',
    'Retirement age below minimum': 'La edad de retiro es menor a la mínima permitida.',
    'Timelock years below minimum': 'El timelock es menor al mínimo permitido.',
    'Timelock years above maximum': 'El timelock excede el máximo permitido.',
    'Insufficient USDC balance': 'Balance de USDC insuficiente para crear el fondo.',
    'USDC transfer failed': 'La transferencia de USDC falló. Verifica tu aprobación y balance.',
    'ERC20: insufficient allowance': 'Aprobación de USDC insuficiente. Aprobar primero.',
    'ERC20: transfer amount exceeds balance': 'El monto a transferir excede tu balance de USDC.',
  };

  for (const [key, value] of Object.entries(friendlyMessages)) {
    if (revertReason.includes(key)) {
      return value;
    }
  }

  return revertReason
    .replace(/^Error: /, '')
    .replace(/execution reverted: /, '')
    .trim();
}

export function formatErrorForUI(error: any): {
  title: string;
  message: string;
  details?: string;
  suggestions?: string[];
} {
  const parsed = parseContractError(error);

  if (parsed.isUserRejection) {
    return {
      title: 'Transacción Cancelada',
      message: 'Has rechazado la transacción en tu wallet.',
      suggestions: ['Intenta nuevamente si fue un error.'],
    };
  }

  if (parsed.code === 'INSUFFICIENT_GAS') {
    return {
      title: 'Gas Insuficiente',
      message: parsed.message,
      suggestions: [
        'Asegúrate de tener suficiente ETH/POL para pagar el gas.',
        'Puedes obtener ETH/POL de testnet en un faucet.',
      ],
    };
  }

  if (parsed.code === 'INSUFFICIENT_ALLOWANCE') {
    return {
      title: 'Aprobación Insuficiente',
      message: parsed.message,
      suggestions: [
        'Aprueba primero el contrato para usar tu USDC.',
        'Asegúrate de aprobar el monto completo requerido.',
      ],
    };
  }

  if (parsed.code === 'INSUFFICIENT_BALANCE') {
    return {
      title: 'Balance Insuficiente',
      message: parsed.message,
      suggestions: [
        'Verifica tu balance de USDC.',
        'Puedes obtener USDC de testnet en un faucet.',
      ],
    };
  }

  if (parsed.isContractRevert && parsed.reason) {
    return {
      title: 'Error del Contrato',
      message: parsed.message,
      details: parsed.reason,
      suggestions: [
        'Revisa los parámetros de tu fondo.',
        'Asegúrate de cumplir con todos los requisitos del contrato.',
      ],
    };
  }

  return {
    title: 'Error en la Transacción',
    message: parsed.message,
    suggestions: [
      'Verifica tu conexión y balance.',
      'Intenta nuevamente en unos momentos.',
    ],
  };
}

export function useContractErrorHandler() {
  const handleError = (error: any, onError?: (formattedError: ReturnType<typeof formatErrorForUI>) => void) => {
    console.error('🔴 Contract Error:', error);
    const formatted = formatErrorForUI(error);
    console.error('📋 Formatted Error:', formatted);
    
    if (onError) {
      onError(formatted);
    }
    
    return formatted;
  };

  return { handleError };
}