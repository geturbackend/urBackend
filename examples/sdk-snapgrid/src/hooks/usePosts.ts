import { useState, useEffect, useCallback } from 'react';
import { Post, Category } from '../types';
import { fetchPosts } from '../services/postsService';

export function usePosts(category: Category, search: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts(category, search);
      setPosts(data);
    } catch (e) {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { posts, loading, error, refetch: load };
}