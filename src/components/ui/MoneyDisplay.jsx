import { useState, useEffect } from 'react';
import { getConfiguracion } from '../../services/configService';

/**
 * Componente para mostrar montos en USD con conversión a Bs
 *
 * @param {number} amount - Monto en dólares
 * @param {string} size - Tamaño del texto: 'sm', 'md', 'lg', 'xl', '2xl', '3xl'
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} showBs - Mostrar o no la conversión a Bs (default: true)
 * @param {string} color - Color del texto: 'default', 'green', 'red', 'blue', 'amber'
 */
const MoneyDisplay = ({
  amount = 0,
  size = 'md',
  className = '',
  showBs = true,
  color = 'default'
}) => {
  const [precioDolar, setPrecioDolar] = useState(0);

  useEffect(() => {
    loadPrecioDolar();
  }, []);

  const loadPrecioDolar = async () => {
    const { success, data } = await getConfiguracion('precio_dolar');
    if (success && data) {
      setPrecioDolar(parseFloat(data.valor) || 0);
    }
  };

  const montoEnBs = (parseFloat(amount) * precioDolar).toFixed(2);

  // Tamaños de texto
  const sizeClasses = {
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const bsSizeClasses = {
    'sm': 'text-xs',
    'md': 'text-xs',
    'lg': 'text-sm',
    'xl': 'text-sm',
    '2xl': 'text-base',
    '3xl': 'text-lg',
  };

  // Colores
  const colorClasses = {
    'default': 'text-gray-900',
    'green': 'text-green-600',
    'red': 'text-red-600',
    'blue': 'text-blue-600',
    'amber': 'text-amber-600',
    'sky': 'text-sky-600',
    'white': 'text-white',
  };

  const bsColorClasses = {
    'default': 'text-gray-500',
    'green': 'text-green-500',
    'red': 'text-red-500',
    'blue': 'text-blue-500',
    'amber': 'text-amber-500',
    'sky': 'text-sky-500',
    'white': 'text-white/80',
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <span className={`font-bold ${sizeClasses[size]} ${colorClasses[color]}`}>
        ${parseFloat(amount).toFixed(2)}
      </span>
      {showBs && precioDolar > 0 && (
        <span className={`${bsSizeClasses[size]} ${bsColorClasses[color]} font-medium`}>
          {montoEnBs} Bs.
        </span>
      )}
    </div>
  );
};

export default MoneyDisplay;
