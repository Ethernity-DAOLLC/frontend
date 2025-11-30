import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
  variant?: 'default' | 'highlighted' | 'outline';
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  link,
  onClick,
  variant = 'default'
}) => {

  const getVariantStyles = () => {
    switch (variant) {
      case 'highlighted':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 shadow-lg';
      case 'outline':
        return 'bg-white border-2 border-gray-300 hover:border-green-500';
      default:
        return 'bg-white shadow-lg hover:shadow-xl';
    }
  };

  const cardContent = (
    <>
      <div className="text-green-600 mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-3 text-gray-800">
        {title}
      </h3>

      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </>
  );

  const baseStyles = `
    rounded-xl p-6 transition-all duration-300
    transform hover:-translate-y-2
    ${getVariantStyles()}
    ${onClick || link ? 'cursor-pointer' : ''}
  `;

  if (link) {
    return (
      <a
        href={link}
        className={baseStyles}
        target={link.startsWith('http') ? '_blank' : undefined}
        rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {cardContent}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} text-left w-full`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className={baseStyles}>
      {cardContent}
    </div>
  );
};

export default FeatureCard;
