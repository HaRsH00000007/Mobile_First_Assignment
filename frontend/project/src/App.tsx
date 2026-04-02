import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { UserSelection } from './components/UserSelection';
import { RecommendationsGrid } from './components/RecommendationsGrid';
import { apiService, Product } from './services/api';

function App() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    userId: string;
    n: number;
    lambdaMmr: number;
  } | null>(null);

  const handleGetRecommendations = async (
    userId: string,
    n: number,
    lambdaMmr: number
  ) => {
    setLoading(true);
    setError(null);
    setLastRequest({ userId, n, lambdaMmr });

    try {
      const data = await apiService.getRecommendations(userId, n, lambdaMmr);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch recommendations'
      );
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastRequest) {
      handleGetRecommendations(
        lastRequest.userId,
        lastRequest.n,
        lastRequest.lambdaMmr
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UserSelection
              onGetRecommendations={handleGetRecommendations}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-2">
            <RecommendationsGrid
              recommendations={recommendations}
              loading={loading}
              error={error}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
