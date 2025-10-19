import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasIcon = !!icon;
  const iconPaddingClass = hasIcon
    ? (iconPosition === 'left' ? 'pl-10' : 'pr-10')
    : '';

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5
            border border-gray-300 rounded-lg
            bg-white
            text-gray-900 placeholder-gray-400
            focus:ring-2 focus:ring-sky-500 focus:border-transparent
            transition-all duration-200
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${iconPaddingClass}
            ${error ? 'border-red-300 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {hasIcon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
