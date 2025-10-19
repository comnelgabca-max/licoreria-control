import { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glass = false,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white border border-gray-200/50',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200/50',
    elevated: 'bg-white shadow-lg border-0',
  };

  const hoverClass = hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]' : '';
  const glassClass = glass ? variants.glass : variants[variant];

  return (
    <div
      ref={ref}
      className={`rounded-xl ${glassClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
