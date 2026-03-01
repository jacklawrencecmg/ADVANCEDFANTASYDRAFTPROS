import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { sportsDataAPI } from '../services/sportsdataApi';

type NewsType = 'injury' | 'trade' | 'depth_chart' | 'performance';
type NewsImpact = 'high' | 'medium' | 'low';

interface NewsItem {
  id: string;
  player_name: string;
  title: string;
  description: string;
  impact: NewsImpact;
  type: NewsType;
  timestamp: string;
  source?: string;
}

function classifyType(title: string, content: string): NewsType {
  const text = `${title} ${content}`.toLowerCase();
  if (/injur|questionable|doubtful|out|ir|placed on|hamstring|ankle|knee|shoulder|concussion|ill|sick/.test(text)) return 'injury';
  if (/trade|traded|acquir|sign|signed|contract|extension|released|cut|waiv/.test(text)) return 'trade';
  if (/depth chart|starter|benched|starting|demoted|promoted|role|snap|target/.test(text)) return 'depth_chart';
  return 'performance';
}

function classifyImpact(title: string, content: string, type: NewsType): NewsImpact {
  const text = `${title} ${content}`.toLowerCase();
  if (type === 'injury') {
    if (/out for season|season-ending|torn|fractur|surgery|ir|placed on/.test(text)) return 'high';
    if (/questionable|doubtful|limited/.test(text)) return 'medium';
    return 'low';
  }
  if (type === 'trade') {
    if (/star|top|key|significant|major|first-round|1st round/.test(text)) return 'high';
    return 'medium';
  }
  if (type === 'depth_chart') {
    if (/starter|wr1|rb1|qb1|te1|lead back|primary/.test(text)) return 'high';
    return 'medium';
  }
  return 'low';
}

export default function PlayerNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawNews = await sportsDataAPI.getNews();

      const mapped: NewsItem[] = rawNews
        .filter(item => item.Title && item.Name)
        .map(item => {
          const type = classifyType(item.Title, item.Content || '');
          const impact = classifyImpact(item.Title, item.Content || '', type);
          return {
            id: String(item.NewsID),
            player_name: item.Name,
            title: item.Title,
            description: item.Content || item.Title,
            impact,
            type,
            timestamp: item.Updated,
            source: item.Source,
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      setNews(mapped);
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Unable to load news. Check your SportsData.io API key.');
    }
    setLoading(false);
  };

  const getImpactColor = (impact: NewsImpact) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'low': return 'bg-green-500/20 border-green-500/30 text-green-400';
    }
  };

  const getTypeIcon = (type: NewsType) => {
    switch (type) {
      case 'injury': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'trade': return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'depth_chart': return <TrendingUp className="w-5 h-5 text-yellow-400" />;
      default: return <Newspaper className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredNews = filter === 'all' ? news : news.filter(n => n.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Player News Feed</h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'injury', 'trade', 'depth_chart', 'performance'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
                  filter === f ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'All News' : f === 'depth_chart' ? 'Depth Chart' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
            <button
              onClick={loadNews}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading live news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No news items found{filter !== 'all' ? ` for "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-700/50 rounded-lg flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div>
                        <h3 className="text-lg font-bold mb-1 leading-tight">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.player_name}</p>
                      </div>
                      <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${getImpactColor(item.impact)}`}>
                        {item.impact.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3 text-sm leading-relaxed">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      {item.source && <span>· {item.source}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
