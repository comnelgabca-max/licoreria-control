const EmptyState = ({
  icon,
  title = 'No hay datos',
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl opacity-60">{icon || '📭'}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
