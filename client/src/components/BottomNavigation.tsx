import { Link } from "wouter";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavigationProps {
  currentPage: string;
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const { user } = useAuth();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'discover', icon: Search, label: 'Discover', path: '/discover' },
    { id: 'create', icon: Plus, label: '', path: '/camera' },
    { id: 'inbox', icon: MessageCircle, label: 'Inbox', path: '/inbox' },
    { id: 'profile', icon: User, label: 'Profile', path: `/profile/${user?.id || ''}` },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 safe-area-pb">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Link key={item.id} href={item.path} className="flex-1">
                <div className="flex flex-col items-center py-2">
                  {item.id === 'create' ? (
                    <div className="relative">
                      <div className="w-8 h-6 bg-white rounded-sm flex items-center justify-center relative z-10">
                        <div className="absolute -left-1 w-6 h-6 bg-red-500 rounded-sm"></div>
                        <div className="absolute -right-1 w-6 h-6 bg-blue-400 rounded-sm"></div>
                        <Plus className="w-4 h-4 text-black relative z-20" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Icon 
                        className={`w-6 h-6 mb-1 ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`} 
                      />
                      {item.label && (
                        <span className={`text-xs ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
