import {
  useReadContract,
  useReadContracts,
} from 'wagmi';
import DateTimeABI from '../../abis/DateTime.json';

export interface DateTime {
  year: bigint;
  month: bigint;
  day: bigint;
  hour: bigint;
  minute: bigint;
  second: bigint;
  weekday: bigint;
}

export interface DateTimeParsed {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

export function useDateTime(dateTimeAddress: `0x${string}`) {
  const useCurrentDateTime = () => {
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'toDateTime',
      args: [timestamp],
    });
  };

  const useToDateTime = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'toDateTime',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetYear = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getYear',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetMonth = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getMonth',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetDay = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getDay',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetHour = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getHour',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetMinute = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getMinute',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetSecond = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getSecond',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetWeekday = (timestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getWeekday',
      args: [timestamp],
      query: { enabled: timestamp > 0n },
    });
  };

  const useGetDaysInMonth = (year: bigint, month: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'getDaysInMonth',
      args: [year, month],
      query: { enabled: year > 0n && month > 0n && month <= 12n },
    });
  };

  const useIsLeapYear = (year: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'isLeapYear',
      args: [year],
      query: { enabled: year > 0n },
    });
  };

  const useAddDays = (timestamp: bigint, days: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'addDays',
      args: [timestamp, days],
      query: { enabled: timestamp > 0n && days >= 0n },
    });
  };

  const useDiffDays = (fromTimestamp: bigint, toTimestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'diffDays',
      args: [fromTimestamp, toTimestamp],
      query: { enabled: fromTimestamp > 0n && toTimestamp > 0n },
    });
  };

  const useMonthsBetween = (fromTimestamp: bigint, toTimestamp: bigint) => {
    return useReadContract({
      address: dateTimeAddress,
      abi: DateTimeABI,
      functionName: 'monthsBetween',
      args: [fromTimestamp, toTimestamp],
      query: { enabled: fromTimestamp > 0n && toTimestamp > 0n && toTimestamp >= fromTimestamp },
    });
  };

  const useFullDateInfo = (timestamp: bigint) => {
    const { data, isLoading, error } = useReadContracts({
      contracts: [
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getYear',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getMonth',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getDay',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getHour',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getMinute',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getSecond',
          args: [timestamp],
        },
        {
          address: dateTimeAddress,
          abi: DateTimeABI,
          functionName: 'getWeekday',
          args: [timestamp],
        },
      ],
      query: { enabled: timestamp > 0n },
    });

    const [year, month, day, hour, minute, second, weekday] = data || [];

    const parsedDate: DateTimeParsed | undefined =
      year?.result && month?.result && day?.result
        ? {
            year: Number(year.result),
            month: Number(month.result),
            day: Number(day.result),
            hour: Number(hour?.result || 0n),
            minute: Number(minute?.result || 0n),
            second: Number(second?.result || 0n),
            weekday: Number(weekday?.result || 0n),
          }
        : undefined;

    return {
      data: parsedDate,
      isLoading,
      error,
    };
  };

  return {
    useCurrentDateTime,
    useToDateTime,
    useGetYear,
    useGetMonth,
    useGetDay,
    useGetHour,
    useGetMinute,
    useGetSecond,
    useGetWeekday,
    useGetDaysInMonth,
    useIsLeapYear,
    useAddDays,
    useDiffDays,
    useMonthsBetween,
    useFullDateInfo,
  };
}
export const dateTimeUtils = {
  toJSDate: (dateTime: DateTime): Date => {
    return new Date(
      Number(dateTime.year),
      Number(dateTime.month) - 1,
      Number(dateTime.day),
      Number(dateTime.hour),
      Number(dateTime.minute),
      Number(dateTime.second)
    );
  },

  timestampToDate: (timestamp: bigint): Date => {
    return new Date(Number(timestamp) * 1000);
  },

  dateToTimestamp: (date: Date): bigint => {
    return BigInt(Math.floor(date.getTime() / 1000));
  },

  formatDateTime: (dateTime: DateTimeParsed): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const weekdayNames = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    return `${weekdayNames[dateTime.weekday]}, ${monthNames[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year} at ${String(dateTime.hour).padStart(2, '0')}:${String(dateTime.minute).padStart(2, '0')}:${String(dateTime.second).padStart(2, '0')}`;
  },

  formatDate: (dateTime: DateTimeParsed): string => {
    return `${dateTime.year}-${String(dateTime.month).padStart(2, '0')}-${String(dateTime.day).padStart(2, '0')}`;
  },

  calculateAgeInYears: (birthTimestamp: bigint, currentTimestamp: bigint): number => {
    const millisecondsDiff = Number(currentTimestamp - birthTimestamp) * 1000;
    const years = millisecondsDiff / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  },

  getCurrentTimestamp: (): bigint => {
    return BigInt(Math.floor(Date.now() / 1000));
  },

  yearsToSeconds: (years: number): bigint => {
    return BigInt(Math.floor(years * 365.25 * 24 * 60 * 60));
  },

  daysToSeconds: (days: number): bigint => {
    return BigInt(days * 24 * 60 * 60);
  },

  secondsToDays: (seconds: bigint): number => {
    return Number(seconds) / (24 * 60 * 60);
  },

  secondsToYears: (seconds: bigint): number => {
    return Number(seconds) / (365.25 * 24 * 60 * 60);
  },
};
export function useDateTimeHelpers(dateTimeAddress: `0x${string}`) {
  const dateTime = useDateTime(dateTimeAddress);
  const useMonthsUntilRetirement = (retirementTimestamp: bigint) => {
    const currentTimestamp = dateTimeUtils.getCurrentTimestamp();
    return dateTime.useMonthsBetween(currentTimestamp, retirementTimestamp);
  };

  const useDaysUntilUnlock = (timelockEndTimestamp: bigint) => {
    const currentTimestamp = dateTimeUtils.getCurrentTimestamp();
    return dateTime.useDiffDays(currentTimestamp, timelockEndTimestamp);
  };

  const useRetirementDateInfo = (retirementTimestamp: bigint) => {
    return dateTime.useFullDateInfo(retirementTimestamp);
  };

  const useIsBurnOrRenewDay = (timestamp: bigint) => {
    const { data: day } = dateTime.useGetDay(timestamp);
    
    return {
      isBurnDay: day === 28n,
      isRenewDay: day === 1n,
      currentDay: day,
    };
  };

  return {
    ...dateTime,
    useMonthsUntilRetirement,
    useDaysUntilUnlock,
    useRetirementDateInfo,
    useIsBurnOrRenewDay,
  };
}
export type { DateTime, DateTimeParsed };