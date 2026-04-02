import { Package } from 'lucide-react';
import { Product } from '../services/api';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { useTheme } from '../context/ThemeContext';

interface RecommendationsGridProps {
  recommendations: Product[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RecommendationsGrid({
  recommendations,
  loading,
  error,
  onRetry,
}: RecommendationsGridProps) {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800 p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800 p-6">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800 p-6">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Ready to Get Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Select a user from the left panel and click "Get Recommendations" to see personalized product suggestions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Recommended Products ({recommendations.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
}
