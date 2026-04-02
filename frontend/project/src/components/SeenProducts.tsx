import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { apiService, Product } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface SeenProductsProps {
  userId: string | null;
}

export function SeenProducts({ userId }: SeenProductsProps) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [seenProducts, setSeenProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSeenProducts();
    } else {
      setSeenProducts([]);
    }
  }, [userId]);

  const fetchSeenProducts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await apiService.getSeenProducts(userId);
      setSeenProducts(data.seen_products);
    } catch (error) {
      setSeenProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <span>Previously Seen Products ({seenProducts.length})</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : seenProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {seenProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <span className="font-medium">{product.product_name.substring(0, 40)}...</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">• {product.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No previously seen products</div>
          )}
        </div>
      )}
    </div>
  );
}
