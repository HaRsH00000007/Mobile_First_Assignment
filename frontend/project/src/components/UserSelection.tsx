import { useState, useEffect } from 'react';
import { Search, Users, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';
import { SeenProducts } from './SeenProducts';
import { useTheme } from '../context/ThemeContext';

interface UserSelectionProps {
  onGetRecommendations: (userId: string, n: number, lambdaMmr: number) => void;
  loading: boolean;
}

const SAMPLE_USERS = [
  'AG3D6O4STAQKAY2UVGEUV46KN35Q',
  'AHMY5CWJMMK5BJRBBSNLYT3ONILA',
  'AHCTC6ULH4XB6YHDY6PCH2R772LQ',
  'AECPFYFQVRUWC3KGNLJIOREFP5LQ',
];

export function UserSelection({ onGetRecommendations, loading }: UserSelectionProps) {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [numRecommendations, setNumRecommendations] = useState(5);
  const [lambdaMmr, setLambdaMmr] = useState(0.7);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.fetchUsers(100, 0);
      setUsers(data.users);
      setTotalUsers(data.total_users);
    } catch (error) {
      setUsers(SAMPLE_USERS);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onGetRecommendations(selectedUser, numRecommendations, lambdaMmr);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 dark:shadow-gray-800">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-6 h-6 text-[#FF9900]" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Selection</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select User
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery || selectedUser}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or select a user..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>

          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-gray-900 max-h-60 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  >
                    {user}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No users found</div>
              )}
            </div>
          )}
        </div>

        {totalUsers > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total users in database: {totalUsers.toLocaleString()}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Recommendations: {numRecommendations}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={numRecommendations}
            onChange={(e) => setNumRecommendations(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF9900]"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Diversity vs Relevance: {lambdaMmr.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={lambdaMmr}
            onChange={(e) => setLambdaMmr(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF9900]"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>More Diverse</span>
            <span>More Relevant</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedUser || loading}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-[#FF9900] text-white rounded-lg hover:bg-[#e88f00] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          <Sparkles className="w-5 h-5" />
          <span>{loading ? 'Loading...' : 'Get Recommendations'}</span>
        </button>
      </form>

      <SeenProducts userId={selectedUser} />
    </div>
  );
}
