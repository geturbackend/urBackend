import { Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, dataApi } from '../../lib/api';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';

const TRENDING_COUNTS = [3200, 5100, 7400, 8900];

export default function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch suggested users
  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      const response = await dataApi.getProfiles({ limit: 5, sort: 'followersCount:-1' });
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
  });

  // Search users
  const { data: searchResults } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      try {
        const response = await authApi.getPublicProfile(searchQuery.toLowerCase());
        return response.data ? [response.data] : [];
      } catch {
        return [];
      }
    },
    enabled: searchQuery.trim().length > 0,
  });

  const displayUsers = searchQuery ? searchResults : suggestedUsers;

  return (
    <div className="w-[350px] h-screen sticky top-0 px-6 py-2 hidden lg:block">
      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Who to Follow */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
        <h2 className="px-4 py-3 font-bold text-xl">
          {searchQuery ? 'Search Results' : 'Who to follow'}
        </h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {displayUsers?.slice(0, 5).map((user) => (
            <Link
              key={user._id || user.userId || user.username}
              to={`/profile/${user.username}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar src={user.avatar} alt={user.displayName || user.username} verified={user.verified} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{user.displayName || user.username}</div>
                <div className="text-gray-500 text-sm truncate">@{user.username}</div>
              </div>
            </Link>
          ))}
          {(!displayUsers || displayUsers.length === 0) && (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No users found' : 'No suggestions available'}
            </div>
          )}
        </div>
      </div>

      {/* Trending Topics (Static for now) */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden mt-4">
        <h2 className="px-4 py-3 font-bold text-xl">Trending</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {['#urBackend', '#React', '#TailwindCSS', '#WebDev'].map((tag, idx) => (
            <div key={tag} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div className="text-gray-500 text-sm">Trending #{idx + 1}</div>
              <div className="font-bold">{tag}</div>
              <div className="text-gray-500 text-sm">{TRENDING_COUNTS[idx]} posts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
