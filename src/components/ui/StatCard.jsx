import { forwardRef } from 'react';
import Card from './Card';

const StatCard = forwardRef(({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend = null,
  loading = false,
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: 'from-gray-600 to-gray-700',
    primary: 'from-sky-600 to-sky-700',
    success: 'from-green-600 to-green-700',
    danger: 'from-red-600 to-red-700',
    warning: 'from-amber-600 to-amber-700',
    purple: 'from-purple-600 to-purple-700',
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`} ref={ref} {...props}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={ref}
      className={`bg-gradient-to-br ${variants[variant]} text-white p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative group ${className}`}
      {...props}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-white">{value}</h3>
              {trend && (
                <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-white/70 text-xs mt-2">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-4xl lg:text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
