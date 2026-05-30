'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  User,
  LogOut,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface HeaderUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface HeaderProps {
  user: HeaderUser
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] ?? 'dashboard'

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    assets: 'Assets',
    new: 'Add Asset',
    edit: 'Edit Asset',
    analytics: 'Analytics',
    import: 'Import Data',
    settings: 'Settings',
  }

  return titleMap[lastSegment] ?? 'Dashboard'
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const lastUpdated = new Date()

  const pageTitle = getPageTitle(pathname)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ redirect: false })
      router.push('/login')
    } catch {
      setIsLoggingOut(false)
    }
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-40 bg-[#111118]/80 backdrop-blur-sm border-b border-white/5 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Page title */}
        <div>
          <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
            <RefreshCw className="w-3 h-3" />
            Updated {formatRelativeTime(lastUpdated)}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-200 leading-none">
                  {user.name ?? 'User'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">
                  {user.email}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-[#16213e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        router.push('/settings')
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        void handleLogout()
                      }}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
