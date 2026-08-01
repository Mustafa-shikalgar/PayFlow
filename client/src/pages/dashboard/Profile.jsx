import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max size is 2MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await authService.uploadAvatar(formData);
      updateUser(data.data.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await authService.updateProfile(data);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information and profile picture.
        </p>
      </div>

      {/* Avatar section */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Profile Picture</h2>
        <div className="mt-4 flex items-center gap-6">
          <Avatar user={user} size="xl" />
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary"
            >
              {uploading ? <Spinner size="sm" /> : 'Change Avatar'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="mt-2 text-xs text-gray-400">JPG, PNG, WEBP, GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Account Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              className="input-field"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              className="input-field cursor-not-allowed opacity-60"
              value={user?.email || ''}
              disabled
            />
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="+91 98765 43210"
              {...register('phone', {
                pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Invalid phone number' },
              })}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <div className="flex items-center gap-2">
              <Badge status={user?.role === 'admin' ? 'active' : 'info'}>
                {user?.role}
              </Badge>
              {user?.isEmailVerified ? (
                <Badge status="active">Email Verified</Badge>
              ) : (
                <Badge status="pending">Email Not Verified</Badge>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};