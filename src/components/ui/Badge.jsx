import { forwardRef } from 'react';

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-sky-100 text-sky-800 border border-sky-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
