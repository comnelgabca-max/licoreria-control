const SkeletonLoader = ({ className = '', variant = 'default' }) => {
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <tr className={className}>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      </tr>
    );
  }

  if (variant === 'list-item') {
    return (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`}></div>
  );
};

export default SkeletonLoader;
