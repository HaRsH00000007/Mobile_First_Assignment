import { useState } from 'react';
import { Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: Product;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Electronics: 'bg-blue-100 text-blue-800',
    'Computers&Accessories': 'bg-purple-100 text-purple-800',
    'Home&Kitchen': 'bg-green-100 text-green-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const getMethodBadge = (method: string) => {
  const badges: Record<string, string> = {
    'content-based (new user)': 'bg-orange-100 text-orange-800',
    'mostly content-based': 'bg-yellow-100 text-yellow-800',
    'hybrid (content-leaning)': 'bg-blue-100 text-blue-800',
    'hybrid (collaborative-leaning)': 'bg-green-100 text-green-800',
  };
  return badges[method] || 'bg-gray-100 text-gray-800';
};

export function ProductCard({ product }: ProductCardProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [showFullReason, setShowFullReason] = useState(false);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-800 hover:shadow-xl dark:hover:shadow-gray-700 transition-shadow duration-300 overflow-hidden group">
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <div className="text-4xl font-bold text-gray-400 dark:text-gray-600">
              {product.product_name.charAt(0)}
            </div>
          </div>
        ) : (
          <img
            src={product.img_link}
            alt={product.product_name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1"
            title={product.product_name}
          >
            {product.product_name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {product.main_category && (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                product.main_category
              )}`}
            >
              {product.main_category}
            </span>
          )}
          {product.method && (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getMethodBadge(
                product.method
              )}`}
            >
              {product.method}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex">{renderStars(product.rating)}</div>
          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
        </div>

        {product.score !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Recommendation Score</span>
              <span>{(product.score * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-[#FF9900] h-2 rounded-full transition-all duration-500"
                style={{ width: `${product.score * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {product.reason && (
          <div className="mb-3">
            <p
              className={`text-xs italic text-gray-600 dark:text-gray-400 ${
                !showFullReason ? 'line-clamp-2' : ''
              }`}
            >
              {product.reason}
            </p>
            {product.reason.length > 100 && (
              <button
                onClick={() => setShowFullReason(!showFullReason)}
                className="text-xs text-[#FF9900] hover:underline dark:hover:text-orange-400 mt-1 flex items-center gap-1"
              >
                {showFullReason ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {product.discounted_price ? (
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            ₹{product.discounted_price.toLocaleString()}
          </div>
        ) : null}

        {product.product_link && (
          <a
            href={product.product_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF9900] text-white rounded-lg hover:bg-[#e88f00] dark:hover:bg-orange-600 transition-colors font-medium"
          >
            View on Amazon
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
