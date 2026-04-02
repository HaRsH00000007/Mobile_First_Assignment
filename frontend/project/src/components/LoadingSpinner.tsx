import { useTheme } from '../context/ThemeContext';

export function LoadingSpinner() {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center justify-center p-12">
      <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-t-[#FF9900]`}></div>
    </div>
  );
}
