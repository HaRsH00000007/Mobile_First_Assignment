import { useEffect, useState } from 'react';
import { ShoppingCart, Moon, Sun } from 'lucide-react';
import { apiService, HealthStatus } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export function Navbar() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const { isDark, toggleDarkMode } = useTheme();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await apiService.checkHealth();
        setHealth(status);
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-gray-900 dark:bg-gray-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-[#FF9900]" />
            <h1 className="text-xl font-bold">Amazon Recommendation Engine</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              ></div>
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {health && (
              <div className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
                {health.total_users.toLocaleString()} users | {health.total_products.toLocaleString()} products
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
