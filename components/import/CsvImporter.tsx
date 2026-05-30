'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, X, Loader2 } from 'lucide-react'

interface ParsedRow {
  name?: string
  category?: string
  currentValue?: string
  purchasePrice?: string
  purchaseDate?: string
  currency?: string
  quantity?: string
  ticker?: string
  location?: string
  notes?: string
  [key: string]: string | undefined
}

interface ImportResult {
  created: number
  errors: string[]
  total: number
}

const REQUIRED_COLUMNS = ['name', 'category', 'currentValue']
const ALL_COLUMNS = ['name', 'category', 'currentValue', 'purchasePrice', 'purchaseDate', 'currency', 'quantity', 'ticker', 'location', 'notes']

function normalizeHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const h of headers) {
    const normalized = h.trim().toLowerCase().replace(/[\s_-]+/g, '')
    for (const col of ALL_COLUMNS) {
      if (normalized === col.toLowerCase()) {
        map[h] = col
        break
      }
    }
  }
  return map
}

function parseCsvText(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const headerMap = normalizeHeaders(rawHeaders)

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: ParsedRow = {}
    rawHeaders.forEach((header, i) => {
      const mappedKey = headerMap[header]
      if (mappedKey) {
        row[mappedKey] = values[i] || ''
      }
    })
    return row
  })
}

export function CsvImporter() {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a CSV file (.csv)')
      return
    }
    setParseError(null)
    setResult(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCsvText(text)
      if (rows.length === 0) {
        setParseError('No data rows found in the file.')
        return
      }
      const missing = REQUIRED_COLUMNS.filter(col => !Object.keys(rows[0]).includes(col))
      if (missing.length > 0) {
        setParseError(`Missing required columns: ${missing.join(', ')}`)
        setParsedRows([])
        return
      }
      setParsedRows(rows)
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      })
      const data = await res.json() as ImportResult
      setResult(data)
      if (data.created > 0) {
        setParsedRows([])
        setFileName(null)
      }
    } catch {
      setResult({ created: 0, errors: ['Network error. Please try again.'], total: parsedRows.length })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setParsedRows([])
    setFileName(null)
    setParseError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      {/* Result banner */}
      {result && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          result.errors.length === 0
            ? 'bg-green-500/10 border-green-500/30'
            : result.created > 0
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          {result.created > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${result.created > 0 ? 'text-green-300' : 'text-red-300'}`}>
              {result.created > 0
                ? `Successfully imported ${result.created} of ${result.total} assets`
                : 'Import failed'}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-xs text-yellow-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {err}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className="text-xs text-slate-500">+{result.errors.length - 5} more errors</li>
                )}
              </ul>
            )}
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {parsedRows.length === 0 && !result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
          }`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-white font-medium mb-1">Drop your CSV file here</p>
          <p className="text-slate-500 text-sm">or click to browse</p>
          {parseError && (
            <p className="mt-3 text-sm text-red-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {parseError}
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">{fileName}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {parsedRows.length} rows
              </span>
            </div>
            <button onClick={reset} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Table preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {['name', 'category', 'currentValue', 'purchasePrice', 'purchaseDate', 'ticker', 'currency'].map(col => (
                    <th key={col} className="text-left text-slate-400 font-medium px-4 py-2.5 uppercase tracking-wider">
                      {col}
                      {REQUIRED_COLUMNS.includes(col) && <span className="text-red-500 ml-0.5">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parsedRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    {['name', 'category', 'currentValue', 'purchasePrice', 'purchaseDate', 'ticker', 'currency'].map(col => (
                      <td key={col} className="px-4 py-2.5 text-slate-300 truncate max-w-[150px]">
                        {row[col] || <span className="text-slate-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 5 && (
            <p className="text-xs text-slate-600 px-5 py-3 border-t border-slate-800">
              Showing 5 of {parsedRows.length} rows — all will be imported
            </p>
          )}

          <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <span className="text-red-500">*</span> Required columns. Optional fields left blank will be skipped.
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Import {parsedRows.length} Assets</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Format guide */}
      {parsedRows.length === 0 && !result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Expected CSV Format</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 font-medium pb-2 pr-4">Column</th>
                  <th className="text-left text-slate-400 font-medium pb-2 pr-4">Required</th>
                  <th className="text-left text-slate-400 font-medium pb-2 pr-4">Example</th>
                  <th className="text-left text-slate-400 font-medium pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {[
                  { col: 'name', req: true, example: 'Apple Inc', note: 'Asset name' },
                  { col: 'category', req: true, example: 'STOCKS', note: 'STOCKS, BONDS, CRYPTO, REAL_ESTATE, CASH, COMMODITIES, PRIVATE_EQUITY, ALTERNATIVE, RETIREMENT, OTHER' },
                  { col: 'currentValue', req: true, example: '15200.00', note: 'Current market value' },
                  { col: 'purchasePrice', req: false, example: '12000.00', note: 'Original purchase price' },
                  { col: 'purchaseDate', req: false, example: '2022-03-15', note: 'YYYY-MM-DD format' },
                  { col: 'currency', req: false, example: 'USD', note: 'Defaults to USD' },
                  { col: 'quantity', req: false, example: '80', note: 'Number of shares/units' },
                  { col: 'ticker', req: false, example: 'AAPL', note: 'Stock ticker symbol' },
                  { col: 'location', req: false, example: 'Fidelity', note: 'Brokerage or location' },
                  { col: 'notes', req: false, example: 'Long-term hold', note: 'Any additional notes' },
                ].map(({ col, req, example, note }) => (
                  <tr key={col}>
                    <td className="py-2 pr-4 font-mono text-blue-400">{col}{req && <span className="text-red-500">*</span>}</td>
                    <td className="py-2 pr-4">{req ? <span className="text-red-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
                    <td className="py-2 pr-4 text-slate-300">{example}</td>
                    <td className="py-2 text-slate-500">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
