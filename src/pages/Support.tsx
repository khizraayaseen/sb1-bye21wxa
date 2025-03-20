import React from 'react';
import { HelpCircle, Headphones, Users, Rocket, ArrowRight } from 'lucide-react';
import Header from '../components/Header';

const Support = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Left Section - Expert Consultant */}
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <span className="text-gray-500 text-sm">Ecomhunt Consultant</span>
          <h1 className="text-2xl font-bold mt-1">1-On-1 Expert Consultant With Jack</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-3 shadow-sm">
          <div className="text-primary">
            <HelpCircle size={24} />
          </div>
          <p className="text-gray-600">Expert support available for pro members only. Please upgrade</p>
        </div>

        <button className="bg-[#47D147] hover:bg-[#47D147]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
          Upgrade to Pro <ArrowRight size={20} />
        </button>
      </div>

      {/* Right Section - Support Options */}
      <div className="border-t border-gray-200 lg:border-t-0 p-6 lg:p-8">
        <div className="mb-8">
          <span className="text-gray-500 text-sm">Got a question?</span>
          <h2 className="text-2xl font-bold mt-1">We are here to help :)</h2>
        </div>

        <div className="space-y-4">
          {/* Help Center */}
          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors flex items-center justify-between group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <HelpCircle size={24} className="text-gray-600" />
              </div>
              <span className="text-gray-600">Most questions are already answered in our help center</span>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Technical Support */}
          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors flex items-center justify-between group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Headphones size={24} className="text-gray-600" />
              </div>
              <span className="text-gray-600">Technical problem? Talk to a support agent now</span>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Community */}
          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors flex items-center justify-between group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Users size={24} className="text-gray-600" />
              </div>
              <span className="text-gray-600">Ask our community if you need several options</span>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Dropshipping Help */}
          <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors flex items-center justify-between group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Rocket size={24} className="text-gray-600" />
              </div>
              <span className="text-gray-600">Need help starting with dropshipping?</span>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;