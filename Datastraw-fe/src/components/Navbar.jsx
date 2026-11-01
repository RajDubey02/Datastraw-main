import React from 'react';
import { User, Headphones, LogOut, Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeView, onViewChange, isAgentLoggedIn, onAgentLogout, onOpenLogin }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 text-sm sm:text-base">
              V&C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight">Verdant & Co</span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200/60">
                  AI Support
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">Vegan Skincare & Customer Care</p>
            </div>
          </div>

          {/* Mobile Right: Agent Auth Status or Login */}
          <div className="sm:hidden flex items-center gap-2">
            {activeView === 'agent' ? (
              isAgentLoggedIn ? (
                <button
                  type="button"
                  onClick={onAgentLogout}
                  className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1 font-medium"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md font-medium"
                >
                  Sign In
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* Center: Toggle Switch */}
        <div className="flex items-center justify-center bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onViewChange('customer')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === 'customer'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer View</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('agent')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === 'agent'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Agent View</span>
          </button>
        </div>

        {/* Desktop Right Action */}
        <div className="hidden sm:flex items-center gap-3">
          {activeView === 'agent' ? (
            isAgentLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  agent@verdant.co
                </span>
                <button
                  type="button"
                  onClick={onAgentLogout}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
              >
                Sign In as Agent
              </button>
            )
          ) : (
            <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Customer Test Sandbox
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
