'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, X } from 'lucide-react'
import { AssetCategory } from '@prisma/client'
import { assetSchema, type AssetFormData } from '@/lib/validators'
import { getAssetCategoryLabel } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'SGD']

interface AddAssetFormProps {
  assetId?: string
  defaultValues?: Partial<AssetFormData> & { purchaseDate?: string | null }
}

export function AddAssetForm({ assetId, defaultValues }: AddAssetFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!assetId

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      currency: 'USD',
      ...defaultValues,
    },
  })

  const watchedCategory = watch('category')

  const onSubmit = async (data: AssetFormData) => {
    try {
      setServerError(null)

      const url = isEditing ? `/api/assets/${assetId}` : '/api/assets'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json() as { error?: string }

      if (!response.ok) {
        setServerError(result.error ?? 'Failed to save asset. Please try again.')
        return
      }

      router.push('/assets')
      router.refresh()
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    }
  }

  const showTickerField = (
    [AssetCategory.STOCKS, AssetCategory.BONDS, AssetCategory.CRYPTO, AssetCategory.COMMODITIES] as string[]
  ).includes(watchedCategory)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* Basic info section */}
      <div className="card-dark p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Asset Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Apple Inc., Primary Residence, Bitcoin"
              className="input-dark"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              id="category"
              className="input-dark"
              {...register('category')}
            >
              <option value="">Select a category</option>
              {Object.values(AssetCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {getAssetCategoryLabel(cat)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-1.5">
              Currency
            </label>
            <select
              id="currency"
              className="input-dark"
              {...register('currency')}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.currency && (
              <p className="mt-1 text-xs text-red-400">{errors.currency.message}</p>
            )}
          </div>

          {/* Ticker (conditional) */}
          {showTickerField && (
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-slate-300 mb-1.5">
                Ticker Symbol
              </label>
              <input
                id="ticker"
                type="text"
                placeholder="e.g., AAPL, BTC"
                className="input-dark uppercase"
                {...register('ticker')}
              />
              {errors.ticker && (
                <p className="mt-1 text-xs text-red-400">{errors.ticker.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Valuation section */}
      <div className="card-dark p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Valuation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Value */}
          <div>
            <label
              htmlFor="currentValue"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Current Value <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                $
              </span>
              <input
                id="currentValue"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-dark pl-7"
                {...register('currentValue', { valueAsNumber: true })}
              />
            </div>
            {errors.currentValue && (
              <p className="mt-1 text-xs text-red-400">{errors.currentValue.message}</p>
            )}
          </div>

          {/* Purchase Price */}
          <div>
            <label
              htmlFor="purchasePrice"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Purchase Price{' '}
              <span className="text-slate-600 text-xs font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                $
              </span>
              <input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-dark pl-7"
                {...register('purchasePrice', { valueAsNumber: true })}
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-xs text-red-400">{errors.purchasePrice.message}</p>
            )}
          </div>

          {/* Purchase Date */}
          <div>
            <label
              htmlFor="purchaseDate"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Purchase Date{' '}
              <span className="text-slate-600 text-xs font-normal">(optional)</span>
            </label>
            <input
              id="purchaseDate"
              type="date"
              className="input-dark"
              {...register('purchaseDate')}
            />
            {errors.purchaseDate && (
              <p className="mt-1 text-xs text-red-400">
                {errors.purchaseDate.message as string}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Quantity / Units{' '}
              <span className="text-slate-600 text-xs font-normal">(optional)</span>
            </label>
            <input
              id="quantity"
              type="number"
              step="any"
              min="0"
              placeholder="e.g., 100 shares, 1.5 BTC"
              className="input-dark"
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-400">{errors.quantity.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Details section */}
      <div className="card-dark p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Additional Details
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Location / Custodian{' '}
              <span className="text-slate-600 text-xs font-normal">(optional)</span>
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g., Fidelity, Coinbase, Physical - Safe"
              className="input-dark"
              {...register('location')}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-400">{errors.location.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1.5">
              Notes{' '}
              <span className="text-slate-600 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about this asset..."
              className="input-dark resize-none"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-400">{errors.notes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Asset' : 'Add Asset'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
