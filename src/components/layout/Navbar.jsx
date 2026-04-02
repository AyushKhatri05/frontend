import { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-40 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-xl">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                        <BellIcon className="h-5 w-5 text-gray-600" />
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>

                    <div className="relative">
                        <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">{user?.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                                <Link href="/profile"><div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">Profile</div></Link>
                                <Link href="/settings"><div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">Settings</div></Link>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600">Sign out</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;