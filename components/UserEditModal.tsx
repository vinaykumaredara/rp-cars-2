import React, { useState, useEffect } from 'react';
import type { UserDetail, Role, UserStatus } from '../types';
import { updateUserDetails } from '../lib/userService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: UserDetail;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    name: user.name === 'N/A' ? '' : (user.name || ''),
    phone: user.phone === 'N/A' ? '' : (user.phone || ''),
    role: user.role,
    status: user.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state if the user prop changes while the modal is open
    setFormData({
      name: user.name === 'N/A' ? '' : (user.name || ''),
      phone: user.phone === 'N/A' ? '' : (user.phone || ''),
      role: user.role,
      status: user.status,
    });
    setError(null);
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: updateError } = await updateUserDetails(user.id, {
        name: formData.name,
        phone: formData.phone,
        role: formData.role as Role,
        status: formData.status as UserStatus
    });

    if (updateError) {
      setError(updateError);
    } else {
      onSave(); // On success, call the onSave callback which closes the modal
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto p-8 transform transition-all duration-300" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
            <p className="p-2 bg-gray-100 rounded border border-gray-200 text-gray-600 truncate">{user.email || user.id}</p>
            {!user.email && <p className="text-xs text-gray-500 mt-1">Showing User ID because email is not accessible.</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-primary focus:border-primary">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-primary focus:border-primary">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-100 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover transition disabled:bg-opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;