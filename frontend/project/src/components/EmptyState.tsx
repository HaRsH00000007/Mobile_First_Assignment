import { Package } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Recommendations Found</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">{message}</p>
    </div>
  );
}
