"use client";

import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import React from "react";

interface NavbarProps {
  onMenuClick?: () => void;
  userName?: string;
  userInitial?: string;
}

export function Navbar({
  onMenuClick,
  userName = "User",
  userInitial = "U",
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section: Menu Button + App Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="w-6 h-6 text-slate-700" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">⚡</span>
            <h1 className="text-lg font-bold text-slate-900">AthlletiCorp</h1>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Section: Notifications, User */}
        <div className="flex items-center gap-4">
          {/* Search Icon (Mobile) */}
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-700" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-slate-100 rounded-md transition-colors">
            <BellIcon className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {userInitial}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700">
                {userName}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-slate-500" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  Profile Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  Preferences
                </button>
                <hr className="my-2" />
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
