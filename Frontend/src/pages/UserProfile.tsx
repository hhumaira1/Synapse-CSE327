import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

export const UserProfile = () => {
    const { user, updateProfile, isLoading, error } = useUserProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Update form fields when user data loads
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    const handleSave = async () => {
        try {
            await updateProfile({ firstName, lastName });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
        }
    };

    if (isLoading && !user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading profile...</div>
                </div>
            </div>
        );
    }

    const displayName = user?.name ||
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        user?.email?.split('@')[0] ||
        'User';

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>

            <div className="bg-white rounded-lg shadow p-6">
                {/* Avatar and basic info */}
                <div className="flex items-start gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
                                {displayName[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold">{displayName}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        <div className="mt-2 flex gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {user?.role || 'User'}
                            </span>
                            {user?.tenant && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                                    {user.tenant.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">{user?.email}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter first name"
                                    />
                                ) : (
                                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{firstName || '-'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter last name"
                                    />
                                ) : (
                                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{lastName || '-'}</p>
                                )}
                            </div>
                        </div>

                        {/* Role (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <p className="px-3 py-2 bg-gray-50 rounded-lg">{user?.role || '-'}</p>
                        </div>

                        {/* Tenant (read-only) */}
                        {user?.tenant && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Organization
                                </label>
                                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                                    {user.tenant.name} <span className="text-gray-500 text-sm">({user.tenant.type})</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
                            {error}
                        </div>
                    )}

                    {isEditing && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFirstName(user?.firstName || '');
                                    setLastName(user?.lastName || '');
                                }}
                                disabled={isLoading}
                                className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
