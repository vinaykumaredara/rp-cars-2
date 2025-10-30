import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchUsersWithRoles } from '../lib/userService';
import type { UserDetail } from '../types';
import AdminPageLayout from './AdminPageLayout';
import UserEditModal from './UserEditModal';
import DatabaseSetup from './DatabaseSetup';
import { useToast } from '../contexts/ToastContext';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const { addToast } = useToast();

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    const { users, error } = await fetchUsersWithRoles();
    setUsers(users);
    setError(error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUsers();
    
    const channel = supabase
      .channel('user-management-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => refreshUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshUsers]);
  
  const handleEditUser = (user: UserDetail) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  const handleSave = () => {
    addToast('User updated successfully!', 'success');
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-gray-600 p-8">Loading users...</p>;
    }
    if (error && (error.includes("Backend not configured") || error.includes("ambiguous 'role' column"))) {
      return <DatabaseSetup />;
    }
    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error loading users</p>
          <p>{error}</p>
        </div>
      );
    }
    if (users.length === 0) {
      return <p className="text-center text-gray-600 p-8">No users found.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{user.email || user.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditUser(user)} className="text-primary hover:text-primary-hover">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <AdminPageLayout
        title="User Management"
        subtitle="View and manage registered users, their roles, and status."
      >
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          {renderContent()}
        </div>
      </AdminPageLayout>

      {isModalOpen && selectedUser && (
        <UserEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          user={selectedUser}
        />
      )}
    </>
  );
};

export default UserManagement;