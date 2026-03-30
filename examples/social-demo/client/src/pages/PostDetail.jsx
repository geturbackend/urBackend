import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/useAuth';
import { ArrowLeft } from 'lucide-react';
import PostCard from '../components/post/PostCard';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.userId || user?._id;
  const [content, setContent] = useState('');

  const commentMutation = useMutation({
    mutationFn: async (newComment) => {
      await dataApi.createComment(newComment);
      await dataApi.updatePost(id, { commentsCount: (post?.commentsCount || 0) + 1 });
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    commentMutation.mutate({
      postId: id,
      userId: currentUserId,
      content,
      authorId: currentUserId,
      authorUsername: user?.username,
      authorDisplayName: user?.displayName,
      authorAvatar: user?.avatar,
      createdAt: new Date().toISOString()
    });
  };

  // Fetch single post
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await dataApi.getPost(id);
      return response.data;
    },
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const response = await dataApi.getComments({
        postId: id,
        sort: 'createdAt:-1',
      });
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    enabled: !!post,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-bold mb-2">Post not found</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-900 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>

      {/* Post */}
      <PostCard post={post} />

      {/* Comments Section */}
      <div className="border-t-8 border-gray-100 dark:border-gray-900 py-4 px-4">
        <h2 className="text-lg font-bold mb-4">Comments</h2>
        
        {/* Comment Composer */}
        <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=User`}
            alt="You"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post your reply"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-primary focus:outline-none resize-none py-2"
              rows="2"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!content.trim() || commentMutation.isPending}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentMutation.isPending ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </div>
        </form>
        {comments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment._id} className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-start gap-3">
                  <img
                    src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorUsername}`}
                    alt={comment.authorDisplayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{comment.authorDisplayName}</span>
                      <span className="text-gray-500">@{comment.authorUsername}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{comment.content}</p>
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
