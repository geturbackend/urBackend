import { useInfiniteQuery } from '@tanstack/react-query';
import { dataApi } from '../lib/api';
import TweetComposer from '../components/post/TweetComposer';
import PostCard from '../components/post/PostCard';
import { useEffect, useRef } from 'react';

export default function Home() {
  const observerTarget = useRef(null);

  // Fetch posts with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await dataApi.getPosts({
        page: pageParam,
        limit: 10,
        sort: 'createdAt:-1', // urBackend format: field:order (-1 = desc)
      });

      // urBackend returns array directly, not wrapped in {data: [...]}
      const postsArray = Array.isArray(response.data) ? response.data : (response.data.data || []);

      return {
        data: postsArray,
        nextPage: pageParam + 1,
        hasMore: postsArray.length === 10,
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <h1 className="text-xl font-bold">Home</h1>
        </div>
      </div>

      {/* Tweet Composer */}
      <TweetComposer />

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Failed to load posts. Please try again.
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Be the first to post something!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}

          {/* Loading indicator for infinite scroll */}
          <div ref={observerTarget} className="py-4 text-center">
            {isFetchingNextPage && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            )}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-gray-500 text-sm">You've reached the end</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
