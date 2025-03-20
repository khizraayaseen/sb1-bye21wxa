import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  CreditCard, 
  Lock, 
  ChevronRight, 
  Crown, 
  Bell, 
  LogOut,
  Check,
  X,
  ArrowRight,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  description: string; 
}

const Account = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'billing' | 'security'>('personal');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    notifications: {
      marketing: true,
      security: true,
      updates: false
    }
  });

  // Mock user data
  const user = {
    plan: 'free',
    joinDate: 'February 15, 2025'
  };

  // Mock billing history
  const billingHistory: BillingHistoryItem[] = [
    {
      id: 'INV-001',
      date: '2025-02-15',
      amount: 25.00,
      status: 'paid',
      description: 'WinProd AI Pro Plan - Monthly'
    },
    {
      id: 'INV-002',
      date: '2025-01-15',
      amount: 25.00,
      status: 'paid',
      description: 'WinProd AI Pro Plan - Monthly'
    },
    {
      id: 'INV-003',
      date: '2024-12-15',
      amount: 25.00,
      status: 'failed',
      description: 'WinProd AI Pro Plan - Monthly'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (key: keyof typeof formData.notifications) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setLoading(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
      }
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formData.fullName}</div>
                    <div className="text-sm text-gray-500">{formData.email}</div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                    activeTab === 'personal'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>Personal Info</span>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                    activeTab === 'billing'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} />
                    <span>Billing & Plan</span>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                    activeTab === 'security'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock size={18} />
                    <span>Security</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Current Plan Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={20} className="text-[#FFD700]" />
                    <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {user.plan === 'free' ? (
                      'You are currently on the Free plan'
                    ) : (
                      'You are currently on the Pro plan'
                    )}
                  </p>
                </div>
                {user.plan === 'free' && (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    Upgrade to Pro
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'personal' && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.marketing}
                        onChange={() => handleNotificationChange('marketing')}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700">Marketing emails about new features and updates</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.security}
                        onChange={() => handleNotificationChange('security')}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700">Security alerts and notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.updates}
                        onChange={() => handleNotificationChange('updates')}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700">Product updates and announcements</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Billing Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <CreditCard size={24} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Visa ending in 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/2025</p>
                    </div>
                    <button className="ml-auto text-primary hover:text-primary/90">
                      Update
                    </button>
                  </div>
                </div>

                {/* Billing History */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
                          <th className="pb-3 text-sm font-medium text-gray-500">Description</th>
                          <th className="pb-3 text-sm font-medium text-gray-500">Amount</th>
                          <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                          <th className="pb-3 text-sm font-medium text-gray-500">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {billingHistory.map((item) => (
                          <tr key={item.id}>
                            <td className="py-4 text-sm text-gray-900">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-sm text-gray-900">{item.description}</td>
                            <td className="py-4 text-sm text-gray-900">${item.amount.toFixed(2)}</td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4">
                              <button className="text-primary hover:text-primary/90 text-sm">
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Change */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  </div>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? 'Updating...' : success ? (
                        <>
                          <Check size={16} />
                          Updated Successfully
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
                      <p className="text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Shield size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Current Session</p>
                          <p className="text-sm text-gray-500">Last active: Just now</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;