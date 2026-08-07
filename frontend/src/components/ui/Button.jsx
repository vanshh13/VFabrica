import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  as: Component = 'button',
  className = '',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  children,
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] select-none cursor-pointer";

  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/20 border border-transparent",
    secondary: "bg-[var(--bg)] hover:bg-[var(--bg-elevated)] theme-text-main border theme-border-color shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500",
    outline: "border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
    ghost: "theme-text-main hover:bg-[var(--bg-elevated)] border border-transparent",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 border border-transparent"
  };

  const sizes = {
    sm: "min-h-[36px] h-9 px-3 text-xs gap-1.5",
    md: "min-h-[44px] h-11 px-4.5 text-xs sm:text-sm gap-2",
    lg: "min-h-[48px] h-12 px-6 text-sm sm:text-base gap-2.5"
  };

  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <Component
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </Component>
  );
}

export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}