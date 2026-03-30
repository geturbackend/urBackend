import { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataApi, storageApi } from '../../lib/api';
import { useAuth } from '../../contexts/useAuth';
import { sanitizeUrl } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function TweetComposer({ onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.userId || user?._id;
  const fileInputRef = useRef(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_LENGTH = 280;

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      // Upload images first
      const uploadedImageUrls = [];
      if (images.length > 0) {
        setIsUploading(true);
        for (const image of images) {
          const response = await storageApi.upload(image);
          uploadedImageUrls.push(response.data.url);
        }
        setIsUploading(false);
      }

      // Create post
      return dataApi.createPost({
        userId: currentUserId,
        authorId: currentUserId,
        authorUsername: user.username,
        authorDisplayName: user.displayName || user.username,
        authorAvatar: user.avatar || '',
        authorVerified: user.verified || false,
        content: data.content,
        images: uploadedImageUrls,
        likesCount: 0,
        commentsCount: 0,
        retweetsCount: 0,
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setImages([]);
      setPreviewUrls([]);
      if (onSuccess) onSuccess();
    },
  });

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }

    setImages([...images, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    createPostMutation.mutate({ content: content.trim() });
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const canPost = (content.trim() || images.length > 0) && !isOverLimit && !createPostMutation.isPending && !isUploading;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3">
        <Avatar src={user?.avatar} alt={user?.displayName || user?.username} />
        
        <div className="flex-1">
          <textarea
            id="tweet-composer"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-xl placeholder-gray-500 focus:outline-none resize-none text-gray-900 dark:text-white min-h-[120px]"
            maxLength={MAX_LENGTH + 50} // Allow typing over limit to show error
          />

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className={`grid gap-2 mb-3 rounded-2xl overflow-hidden ${
              previewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={sanitizeUrl(url)} alt="" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image className="w-5 h-5 text-primary" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              {content && (
                <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars}
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canPost}
                size="sm"
              >
                {isUploading ? 'Uploading...' : createPostMutation.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>

          {/* Error */}
          {createPostMutation.error && (
            <div className="mt-2 text-sm text-red-500">
              Failed to create post. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
