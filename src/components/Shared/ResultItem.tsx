import React from "react";

interface ResultItemProps {
  label: string;
  value: string | number | bigint;
  type?:
    | "address"
    | "eth"
    | "currency"
    | "percentage"
    | "date"
    | "number"
    | "text";
  highlight?: boolean;
  status?: "success" | "warning" | "error" | "info";
  loading?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const ResultItem: React.FC<ResultItemProps> = ({
  label,
  value,
  type = "text",
  highlight = false,
  status,
  loading = false,
  onClick,
  icon,
}) => {

  const formatValue = (val: string | number | bigint, type: string): string => {
    try {
      switch (type) {
        case "address":
          const addr = val.toString();
          if (addr.length < 10) return addr;
          return `${addr.slice(0, 6)}...${addr.slice(-4)}`;

        case "eth":
          if (typeof val === 'bigint') {
            return `${(Number(val) / 1e18).toFixed(4)} ETH`;
          }
          return `${val} ETH`;

        case "currency":
          const numVal = typeof val === 'bigint' ? Number(val) : Number(val);
          if (isNaN(numVal)) return "$0.00";
          
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(numVal);

        case "percentage":
          const percentVal = typeof val === 'bigint' ? Number(val) : Number(val);
          if (isNaN(percentVal)) return "0%";
          return `${percentVal.toFixed(2)}%`;

        case "date":
          const timestamp = typeof val === 'bigint' ? Number(val) : Number(val);
          if (isNaN(timestamp) || timestamp === 0) return "N/A";
          
          const date = new Date(timestamp * 1000);
          if (isNaN(date.getTime())) return "Invalid Date";
          
          return date.toLocaleDateString("es-ES", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

        case "number":
          const num = typeof val === 'bigint' ? Number(val) : Number(val);
          if (isNaN(num)) return "0";
          return num.toLocaleString("en-US");

        default:
          return val.toString();
      }
    } catch (error) {
      console.error("Error formatting value:", error, { value: val, type });
      return "Error";
    }
  };

  const getStatusClasses = () => {
    if (loading) return "bg-gray-100 animate-pulse";

    switch (status) {
      case "success":
        return "bg-green-50 border-green-500";
      case "warning":
        return "bg-yellow-50 border-yellow-500";
      case "error":
        return "bg-red-50 border-red-500";
      case "info":
        return "bg-blue-50 border-blue-500";
      default:
        return highlight
          ? "bg-green-50 border-green-500"
          : "bg-gray-50 border-gray-200";
    }
  };

  const getValueColor = () => {
    if (loading) return "text-gray-400";

    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return highlight ? "text-green-600" : "text-gray-800";
    }
  };

  const containerClasses = `
    p-4 rounded-lg border-2 transition-all duration-200
    ${getStatusClasses()}
    ${onClick ? "cursor-pointer hover:shadow-md" : ""}
  `;

  const valueClasses = `
    text-2xl font-bold
    ${getValueColor()}
  `;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      onClick();
    }
  };

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1">
          {icon && <span className="text-gray-500">{icon}</span>}
          <p className="text-sm text-gray-600 font-medium">{label}</p>
        </div>

        {status && (
          <span
            className={`
            text-xs px-2 py-1 rounded-full font-semibold
            ${status === "success" ? "bg-green-100 text-green-700" : ""}
            ${status === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
            ${status === "error" ? "bg-red-100 text-red-700" : ""}
            ${status === "info" ? "bg-blue-100 text-blue-700" : ""}
          `}
          >
            {status.toUpperCase()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse mt-2" />
      ) : (
        <p className={`${valueClasses} mt-2 break-all`}>
          {formatValue(value, type)}
        </p>
      )}
    </div>
  );
};

export default ResultItem;
