import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'link' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    link: 'text-blue-600 underline-offset-4 hover:underline bg-transparent',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  const sizeStyles = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-base'
  };

  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button
      type={type}
      className={styles}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};