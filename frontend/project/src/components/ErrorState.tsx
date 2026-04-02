import { AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-[#FF9900] text-white rounded-lg hover:bg-[#e88f00] dark:hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
