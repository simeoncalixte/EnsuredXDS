import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../colors.js'

export const coverageCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'HKD', 'SGD', 'NZD', 'INR', 'AED', 'ZAR', 'BRL', 'MXN']
export type CurrencyInputProps = {
  label: string
  value?: number | string | null
  currencyCode?: string
  currencies?: string[]
  disabled?: boolean
  renderInput?: (key: 'amount' | 'currencyCode', control: React.ReactNode) => React.ReactNode
  onChange: (value: number | null) => void
  onCurrencyChange: (currency: string) => void
}
const Group = styled.div`
  display: flex; min-width: 0; border: 1px solid ${colors.outlineVariant}; border-radius: 7px;
  background: ${colors.surfaceContainerLow}; overflow: hidden;
  &:focus-within { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
  input, select { color: ${colors.text.primary}; background: transparent; border: 0; padding: 11px 12px; font: inherit; outline: none; }
  input { min-width: 0; width: 100%; }
  select { width: 96px; flex-shrink: 0; border-right: 1px solid ${colors.outlineVariant}; }
  option { background: ${colors.surfaceContainer}; }
`
const format = (value: CurrencyInputProps['value']) => value == null || value === '' ? '' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 10 })

/** Commas are display-only; the controlled value remains numeric (or null when cleared). */
export function CurrencyInput({ label, value, currencyCode = '', currencies = coverageCurrencies, disabled, onChange, onCurrencyChange, renderInput }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(format(value))
  useEffect(() => { if (!focused) setDraft(format(value)) }, [value, focused])
  const decorate = (key: 'amount' | 'currencyCode', control: React.ReactNode) => renderInput ? <div style={{display:'flex',minWidth:0,flex:key==='amount'?1:undefined}}>{renderInput(key,control)}</div> : control
  return <Group>
    {decorate('currencyCode', <select aria-label={`${label} currency`} value={currencyCode} disabled={disabled} onChange={e => onCurrencyChange(e.target.value)}>
      <option value="">Currency</option>
      {[...new Set([...currencies, ...(currencyCode ? [currencyCode] : [])])].map(code => <option key={code} value={code}>{code}</option>)}
    </select>)}
    {decorate('amount', <input aria-label={`${label} amount`} inputMode="decimal" placeholder="Amount" value={draft} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onChange={e => {
        const raw = e.target.value.replace(/,/g, '')
        if (!/^\d*(\.\d*)?$/.test(raw)) return
        const amount = raw === '' || raw === '.' ? null : Number(raw)
        if (amount !== null && !Number.isFinite(amount)) return
        setDraft(e.target.value); onChange(amount)
      }} />)}
  </Group>
}
export default CurrencyInput
