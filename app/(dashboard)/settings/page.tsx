'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Shield, User, Bell, Trash2, Lock } from 'lucide-react'
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/lib/validators'
import { toast } from '@/components/ui/use-toast'

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
]

interface SettingsState {
  currency: string
  alertThreshold: number
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SettingsState>({
    currency: 'USD',
    alertThreshold: 10,
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json() as { settings: SettingsState }
          setSettings(data.settings)
        }
      } catch {
        // Silently fail — defaults will be used
      } finally {
        setIsLoadingSettings(false)
      }
    }
    void fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast({ title: 'Settings saved', description: 'Your preferences have been updated.' })
      } else {
        const data = await res.json() as { error?: string }
        toast({
          title: 'Failed to save',
          description: data.error ?? 'Please try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const onPasswordSubmit = async (data: UpdatePasswordFormData) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json() as { error?: string }

      if (!res.ok) {
        if (result.error?.toLowerCase().includes('current')) {
          setError('currentPassword', { message: result.error })
        } else {
          setError('root', { message: result.error ?? 'Failed to change password' })
        }
        return
      }

      toast({ title: 'Password updated', description: 'Your password has been changed.' })
    } catch {
      setError('root', { message: 'An unexpected error occurred.' })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    try {
      setIsDeletingAccount(true)
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/'
      } else {
        toast({ title: 'Error', description: 'Failed to delete account.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete account.', variant: 'destructive' })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <section className="card-dark p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Name</label>
            <div className="input-dark cursor-not-allowed opacity-60">
              {session?.user?.name ?? 'Not set'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <div className="input-dark cursor-not-allowed opacity-60 truncate">
              {session?.user?.email}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Profile editing coming in a future update.
        </p>
      </section>

      {/* Preferences Section */}
      <section className="card-dark p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Preferences</h3>
        </div>

        <div className="space-y-5">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Default Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="input-dark"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Alert Threshold
              <span className="ml-2 text-blue-400 font-semibold">{settings.alertThreshold}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={settings.alertThreshold}
              onChange={(e) =>
                setSettings({ ...settings, alertThreshold: Number(e.target.value) })
              }
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>1%</span>
              <span>Notify when value changes by this %</span>
              <span>50%</span>
            </div>
          </div>

          <button
            onClick={() => void handleSaveSettings()}
            disabled={isSavingSettings}
            className="btn-primary flex items-center gap-2"
          >
            {isSavingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </section>

      {/* Change Password Section */}
      <section className="card-dark p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.root.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Current Password
            </label>
            <input type="password" className="input-dark" {...register('currentPassword')} />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              New Password
            </label>
            <input type="password" className="input-dark" {...register('newPassword')} />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input type="password" className="input-dark" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </section>

      {/* 2FA Section - Phase 5 placeholder */}
      <section className="card-dark p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Two-Factor Authentication</h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 text-xs font-medium border border-slate-700">
              Phase 5
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Two-factor authentication with TOTP (Google Authenticator / Authy) will be available in
          Phase 5. This adds an extra layer of security to your account.
        </p>
        <button disabled className="mt-4 btn-secondary opacity-50 cursor-not-allowed text-sm">
          Enable 2FA (Coming Soon)
        </button>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input-dark border-red-500/30 focus:border-red-500"
            />
          </div>
          <button
            onClick={() => void handleDeleteAccount()}
            disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDeletingAccount ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Account
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
