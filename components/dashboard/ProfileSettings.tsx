import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCurrentProfile, updateCurrentUserProfile } from '../../lib/userService';
import { useToast } from '../../contexts/ToastContext';

const ProfileSettings: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const { profile, error } = await fetchCurrentProfile();
            if (error) {
                setError(error);
            } else if (profile) {
                setFormData({
                    name: profile.full_name || '',
                    phone: profile.phone || ''
                });
            }
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await updateCurrentUserProfile(formData);
        if (error) {
            addToast(error, 'error');
        } else {
            addToast('Profile updated successfully!', 'success');
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading your profile...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-600">{user?.email}</p>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                </div>
                <div className="text-right pt-2">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:bg-opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default ProfileSettings;
