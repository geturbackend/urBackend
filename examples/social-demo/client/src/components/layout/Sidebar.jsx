import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, User, Settings, LogOut, PenSquare } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-[275px] h-screen sticky top-0 flex flex-col px-4 py-2">
      {/* Logo */}
      <div className="mb-4 px-3 py-2">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const NavIcon = item.icon;
          const { label, path } = item;
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
                isActive
                  ? 'font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              <NavIcon className="w-6 h-6" />
              <span className="text-xl">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tweet Button */}
      <Button
        className="w-full mb-4"
        size="lg"
        onClick={() => document.getElementById('tweet-composer')?.focus()}
      >
        <PenSquare className="w-5 h-5 mr-2 inline" />
        Post
      </Button>

      {/* User Profile */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors"
      >
        <Avatar src={user?.avatar} alt={user?.displayName || user?.username} />
        <div className="flex-1 text-left">
          <div className="font-bold text-sm">{user?.displayName || user?.username}</div>
          <div className="text-gray-500 text-sm">@{user?.username}</div>
        </div>
        <LogOut className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
}
