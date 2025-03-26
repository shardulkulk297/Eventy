
import React from 'react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(
  ({ 
    className, 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    // Button style variants
    const buttonStyles = {
      primary: 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary text-white shadow-lg hover:shadow-primary/20',
      secondary: 'bg-white hover:bg-form-light-gray text-form-dark-gray border border-form-card-border shadow-sm',
      outline: 'bg-transparent border border-form-card-border hover:border-form-dark-gray text-form-dark-gray',
      ghost: 'bg-transparent hover:bg-form-light-gray text-form-dark-gray',
      link: 'bg-transparent text-primary hover:underline p-0 shadow-none',
      danger: 'bg-gradient-to-r from-form-accent-red to-form-accent-red/90 hover:from-form-accent-red/95 hover:to-form-accent-red text-white shadow-lg',
    };
    
    // Button size variants
    const sizeStyles = {
      sm: 'text-sm py-1 px-3 h-8 rounded-md',
      md: 'text-sm py-2 px-4 h-10 rounded-md',
      lg: 'text-base py-2 px-6 h-12 rounded-md',
      icon: 'p-2 aspect-square rounded-full',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          'font-medium inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
          buttonStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
