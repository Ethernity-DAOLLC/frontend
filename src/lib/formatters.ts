export const formatCurrency = (
  value: number | bigint | string,
  options?: {
    decimals?: number;
    locale?: string;
  }
): string => {
  try {
    const { decimals = 0, locale = 'en-US' } = options || {};

    let num: number;
    if (typeof value === 'bigint') {
      num = Number(value);
    } else if (typeof value === 'string') {
      num = parseFloat(value);
    } else {
      num = value;
    }

    if (isNaN(num) || !isFinite(num)) {
      return '$0';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0';
  }
};

export const formatUSDC = (amount: bigint | number | string): string => {
  try {
    let value: number;
    
    if (typeof amount === 'bigint') {
      value = Number(amount) / 1_000_000;
    } else if (typeof amount === 'string') {
      value = parseFloat(amount) / 1_000_000;
    } else {
      value = amount / 1_000_000;
    }

    if (isNaN(value)) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error('Error formatting USDC:', error);
    return '$0.00';
  }
};

export const formatNumber = (
  value: number | bigint | string,
  options?: {
    decimals?: number;
    locale?: string;
  }
): string => {
  try {
    const { decimals = 0, locale = 'en-US' } = options || {};
    
    let num: number;
    if (typeof value === 'bigint') {
      num = Number(value);
    } else if (typeof value === 'string') {
      num = parseFloat(value);
    } else {
      num = value;
    }

    if (isNaN(num) || !isFinite(num)) {
      return '0';
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
};

export const formatPercentage = (
  value: number | bigint | string,
  decimals: number = 2
): string => {
  try {
    let num: number;
    if (typeof value === 'bigint') {
      num = Number(value);
    } else if (typeof value === 'string') {
      num = parseFloat(value);
    } else {
      num = value;
    }

    if (isNaN(num)) return '0%';

    return `${num.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
};

export const formatTimestamp = (
  timestamp: bigint | number | string,
  options?: {
    locale?: string;
    includeTime?: boolean;
    format?: 'short' | 'long' | 'full';
  }
): string => {
  try {
    const { 
      locale = 'es', 
      includeTime = true,
      format = 'long'
    } = options || {};

    let ts: number;
    if (typeof timestamp === 'bigint') {
      ts = Number(timestamp);
    } else if (typeof timestamp === 'string') {
      ts = parseInt(timestamp);
    } else {
      ts = timestamp;
    }

    if (isNaN(ts) || ts === 0) {
      return 'Nunca';
    }

    const date = new Date(ts < 10000000000 ? ts * 1000 : ts);

    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const dateOptions: Intl.DateTimeFormatOptions = format === 'short' 
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : format === 'full'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    const formattedDate = date.toLocaleDateString(locale, dateOptions);
    
    if (!includeTime) {
      return formattedDate;
    }

    const formattedTime = date.toLocaleTimeString(locale, timeOptions);
    return `${formattedDate} - ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Error';
  }
};

export const formatAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  try {
    if (!address || typeof address !== 'string') {
      return '0x0...0';
    }

    if (address.length < startChars + endChars) {
      return address;
    }

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  } catch (error) {
    console.error('Error formatting address:', error);
    return '0x0...0';
  }
};

export const parseUSDC = (value: string | number): bigint => {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) {
      return BigInt(0);
    }
    return BigInt(Math.round(num * 1_000_000));
  } catch (error) {
    console.error('Error parsing USDC:', error);
    return BigInt(0);
  }
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatYears = (years: number): string => {
  if (years === 1) return '1 año';
  return `${years} años`;
};