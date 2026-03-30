import { Heart, MessageCircle, Repeat2, Share, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeUrl } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/useAuth';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentUserId = user?.userId || user?._id;
  const isOwner = currentUserId === post.authorId;

  // Check if user liked this post
  const { data: userLike } = useQuery({
    queryKey: ['like', post._id, currentUserId],
    queryFn: async () => {
      const response = await dataApi.getLikes({
        userId: currentUserId,
        targetId: post._id,
        targetType: 'post'
      });
      return Array.isArray(response.data) ? (response.data[0] || null) : (response.data?.data?.[0] || null);
    },
    enabled: !!currentUserId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (userLike) {
        await dataApi.deleteLike(userLike._id);
        const newCount = Math.max(0, (post.likesCount || 0) - 1);
        await dataApi.updatePost(post._id, { likesCount: newCount });
      } else {
        await dataApi.createLike({
          userId: currentUserId,
          targetId: post._id,
          targetType: 'post',
          createdAt: new Date().toISOString(),
        });
        await dataApi.updatePost(post._id, { likesCount: (post.likesCount || 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', post._id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post._id] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => dataApi.deletePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Retweet mutation
  const retweetMutation = useMutation({
    mutationFn: async () => {
      await dataApi.createPost({
        userId: currentUserId,
        authorId: currentUserId,
        authorUsername: user.username,
        authorDisplayName: user.displayName || user.username,
        authorAvatar: user.avatar || '',
        authorVerified: user.verified || false,
        content: `RT @${post.authorUsername}: ${post.content}`,
        images: post.images || [],
        likesCount: 0,
        commentsCount: 0,
        retweetsCount: 0,
        createdAt: new Date().toISOString(),
      });
      await dataApi.updatePost(post._id, { retweetsCount: (post.retweetsCount || 0) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this post?')) {
      deleteMutation.mutate();
    }
  };

  const handleRetweet = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Retweet this post?')) {
      retweetMutation.mutate();
    }
  };

  return (
    <div
      onClick={() => navigate(`/post/${post._id}`)}
      className="block border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${post.authorUsername}`} onClick={(e) => e.stopPropagation()}>
          <Avatar
            src={post.authorAvatar}
            alt={post.authorDisplayName || post.authorUsername}
            verified={post.authorVerified}
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/profile/${post.authorUsername}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold hover:underline truncate"
              >
                {post.authorDisplayName || post.authorUsername}
              </Link>
              <span className="text-gray-500 truncate">@{post.authorUsername}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-3">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-2 mb-3 rounded-2xl overflow-hidden ${
              post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={sanitizeUrl(img)}
                  alt=""
                  className="w-full object-cover max-h-96"
                  onClick={(e) => e.stopPropagation()}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md mt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.commentsCount || 0}</span>
            </button>

            <button
              onClick={handleRetweet}
              className={`flex items-center gap-2 transition-colors group ${
                retweetMutation.isPending ? 'text-green-500 opacity-50' : 'text-gray-500 hover:text-green-500'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.retweetsCount || 0}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors group ${
                userLike ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart className={`w-4 h-4 ${userLike ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{post.likesCount || 0}</span>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Share className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
