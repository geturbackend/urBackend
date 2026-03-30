import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, storageApi, dataApi } from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Camera, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      dataApi.syncProfileFromUser({ ...user, ...variables, updatedAt: new Date().toISOString() });
      alert('Profile updated successfully!');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalProfileData = { ...profileData };

    try {
      if (avatarFile) {
        setIsUploading(true);
        const uploadRes = await storageApi.upload(avatarFile);
        finalProfileData.avatar = uploadRes.data.url;
      }
      
      updateProfileMutation.mutate(finalProfileData);
    } catch (error) {
      console.error('Failed to upload avatar', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-900 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Settings Form */}
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800">
              <Avatar src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.username}`} alt="Avatar preview" size="xl" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col flex-1 items-center justify-center cursor-pointer transition-colors text-white z-10 w-full h-full">
                <Camera className="w-6 h-6" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">Click to change avatar</p>
          </div>
          <Input
            label="Display Name"
            value={profileData.displayName}
            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
            placeholder="Your display name"
          />

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell us about yourself"
              className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
              rows={4}
              maxLength={160}
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {profileData.bio?.length || 0}/160
            </div>
          </div>

          <Input
            label="Location"
            value={profileData.location}
            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
            placeholder="Where you're from"
          />

          <Input
            label="Website"
            type="url"
            value={profileData.website}
            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
            placeholder="https://yourwebsite.com"
          />

          {updateProfileMutation.error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg text-red-500 text-sm">
              Failed to update profile. Please try again.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfileMutation.isPending || isUploading}
          >
            {(updateProfileMutation.isPending || isUploading) ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
