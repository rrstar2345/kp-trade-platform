/**
 * Accounts Widget — P1-05 to P1-07
 * List accounts, add/edit/delete, parent/child toggle, trade factor slider,
 * session enable/disable, connection test.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Wifi, WifiOff, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { Account } from '@/types'
import { cn } from '@/lib/utils'

// ── API helpers ───────────────────────────────────────────────────────────────

const fetchAccounts = () => api.get('/accounts').then(r => r.data as Account[])

const EMPTY_FORM = {
  name: '',
  broker: 'dhan',
  client_id: '',
  access_token: '',
  app_id: '',
  app_secret: '',
  api_key: '',
  is_parent: false,
  parent_id: null as number | null,
  trade_factor: 1.0,
  session_active: true,
  proxy_url: '',
  proxy_port: '' as string | number,
  proxy_username: '',
  proxy_password: '',
}

type FormState = typeof EMPTY_FORM

// ── Main component ────────────────────────────────────────────────────────────

export function AccountsWidget() {
  const qc = useQueryClient()
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [testResult, setTestResult] = useState<Record<number, { ok: boolean; msg: string }>>({})
  const [showProxy, setShowProxy] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounts'] })

  const createMut = useMutation({
    mutationFn: (data: Partial<FormState>) => api.post('/accounts', data),
    onSuccess: () => { invalidate(); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormState> }) =>
      api.put(`/accounts/${id}`, data),
    onSuccess: () => { invalidate(); resetForm() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/accounts/${id}`),
    onSuccess: invalidate,
  })

  const toggleSession = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.put(`/accounts/${id}`, { session_active: active }),
    onSuccess: invalidate,
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowProxy(false)
  }

  function openEdit(acc: Account) {
    setForm({
      ...EMPTY_FORM,
      name: acc.name,
      broker: acc.broker,
      client_id: acc.client_id,
      is_parent: acc.is_parent,
      parent_id: acc.parent_id,
      trade_factor: acc.trade_factor,
      session_active: acc.session_active,
      proxy_url: acc.proxy_url || '',
      proxy_port: acc.proxy_port || '',
      proxy_username: acc.proxy_username || '',
      // tokens are write-only — don't prefill
      access_token: '',
      app_id: '',
      app_secret: '',
      api_key: '',
      proxy_password: '',
    })
    setEditingId(acc.id)
    setShowForm(true)
  }

  function handleSubmit() {
    const payload = {
      ...form,
      proxy_port: form.proxy_port === '' ? undefined : Number(form.proxy_port),
      parent_id: form.is_parent ? null : (form.parent_id || null),
    }
    if (editingId !== null) {
      updateMut.mutate({ id: editingId, data: payload })
    } else {
      createMut.mutate(payload)
    }
  }

  async function testConn(id: number) {
    setTestingId(id)
    try {
      const res = await api.post(`/accounts/${id}/test-connection`)
      setTestResult(prev => ({ ...prev, [id]: { ok: res.data.success, msg: res.data.message } }))
    } catch {
      setTestResult(prev => ({ ...prev, [id]: { ok: false, msg: 'Request failed' } }))
    } finally {
      setTestingId(null)
    }
  }

  const parents = accounts.filter(a => a.is_parent)

  return (
    <div className="flex flex-col h-full gap-2 text-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 text-xs transition-colors"
        >
          <Plus size={12} /> Add Account
        </button>
      </div>

      {/* Account list */}
      {isLoading ? (
        <div className="text-xs text-muted">Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="text-xs text-muted mt-4 text-center">No accounts yet. Add one above.</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-auto">
          {accounts.map(acc => {
            const tr = testResult[acc.id]
            return (
              <div
                key={acc.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md border',
                  acc.session_active
                    ? 'bg-surface-2 border-border'
                    : 'bg-surface-1 border-border/40 opacity-60'
                )}
              >
                {/* Session toggle */}
                <button
                  onClick={() => toggleSession.mutate({ id: acc.id, active: !acc.session_active })}
                  className={cn('shrink-0', acc.session_active ? 'text-profit' : 'text-muted')}
                  title={acc.session_active ? 'Disable session' : 'Enable session'}
                >
                  {acc.session_active ? <Wifi size={13} /> : <WifiOff size={13} />}
                </button>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 truncate">{acc.name}</span>
                    {acc.is_parent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">PARENT</span>
                    )}
                    {!acc.is_parent && acc.parent_id && (
                      <span className="text-[10px] text-muted">
                        child · ×{acc.trade_factor.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted truncate">
                    {acc.broker.toUpperCase()} · {acc.client_id || 'no client id'}
                  </div>
                  {tr && (
                    <div className={cn('text-[10px] mt-0.5', tr.ok ? 'text-profit' : 'text-loss')}>
                      {tr.ok ? '✓' : '✗'} {tr.msg}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => testConn(acc.id)}
                    disabled={testingId === acc.id}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted hover:text-slate-200 hover:border-slate-500 transition-colors disabled:opacity-50"
                  >
                    {testingId === acc.id ? '…' : 'Test'}
                  </button>
                  <button onClick={() => openEdit(acc)} className="p-1 text-muted hover:text-slate-200 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${acc.name}"?`)) deleteMut.mutate(acc.id) }}
                    className="p-1 text-muted hover:text-loss transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={resetForm}>
          <div
            className="bg-surface-1 border border-border rounded-lg p-5 w-[480px] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-100 mb-4">
              {editingId !== null ? 'Edit Account' : 'New Account'}
            </h3>

            <div className="flex flex-col gap-3">
              {/* Basic fields */}
              <Field label="Name">
                <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Dhan Account" />
              </Field>

              <Field label="Broker">
                <select className={INPUT} value={form.broker} onChange={e => setForm(f => ({ ...f, broker: e.target.value }))}>
                  <option value="dhan">Dhan</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Client ID">
                  <input className={INPUT} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} />
                </Field>
                <Field label="Access Token">
                  <input type="password" className={INPUT} value={form.access_token} onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))} placeholder={editingId ? '(unchanged)' : ''} />
                </Field>
                <Field label="App ID">
                  <input className={INPUT} value={form.app_id} onChange={e => setForm(f => ({ ...f, app_id: e.target.value }))} />
                </Field>
                <Field label="App Secret">
                  <input type="password" className={INPUT} value={form.app_secret} onChange={e => setForm(f => ({ ...f, app_secret: e.target.value }))} placeholder={editingId ? '(unchanged)' : ''} />
                </Field>
              </div>

              {/* Parent / child */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_parent}
                    onChange={e => setForm(f => ({ ...f, is_parent: e.target.checked, parent_id: null }))}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-300">Is parent account</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.session_active}
                    onChange={e => setForm(f => ({ ...f, session_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-300">Session active</span>
                </label>
              </div>

              {/* Child-specific */}
              {!form.is_parent && (
                <>
                  <Field label="Parent Account">
                    <select
                      className={INPUT}
                      value={form.parent_id ?? ''}
                      onChange={e => setForm(f => ({ ...f, parent_id: e.target.value ? Number(e.target.value) : null }))}
                    >
                      <option value="">None (standalone)</option>
                      {parents.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Field>
                  {form.parent_id && (
                    <Field label={`Trade Factor: ${form.trade_factor.toFixed(2)}`}>
                      <input
                        type="range" min={0.01} max={1} step={0.01}
                        value={form.trade_factor}
                        onChange={e => setForm(f => ({ ...f, trade_factor: Number(e.target.value) }))}
                        className="w-full accent-accent"
                      />
                    </Field>
                  )}
                </>
              )}

              {/* Proxy (collapsible) */}
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted hover:text-slate-300 transition-colors"
                onClick={() => setShowProxy(p => !p)}
              >
                {showProxy ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Trade Proxy (optional)
              </button>

              {showProxy && (
                <div className="grid grid-cols-2 gap-3 pl-2 border-l border-border">
                  <Field label="Proxy URL">
                    <input className={INPUT} value={form.proxy_url} onChange={e => setForm(f => ({ ...f, proxy_url: e.target.value }))} placeholder="http://proxy.host" />
                  </Field>
                  <Field label="Port">
                    <input type="number" className={INPUT} value={form.proxy_port} onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
                  </Field>
                  <Field label="Username">
                    <input className={INPUT} value={form.proxy_username} onChange={e => setForm(f => ({ ...f, proxy_username: e.target.value }))} />
                  </Field>
                  <Field label="Password">
                    <input type="password" className={INPUT} value={form.proxy_password} onChange={e => setForm(f => ({ ...f, proxy_password: e.target.value }))} />
                  </Field>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={resetForm} className="px-3 py-1.5 text-xs text-muted hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || createMut.isPending || updateMut.isPending}
                className="px-4 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {editingId !== null ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const INPUT = 'w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}