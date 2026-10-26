import React, { useState, useEffect, useRef } from 'react';

interface NumericDimensionInputProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  unit?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (val: number) => void;
  onCommit?: (val: number) => void;
  onError?: (msg: string) => void;
}

/**
 * Robust controlled numeric dimension input.
 * Eliminates the bug where typing resets or clamps values to 10 on every keystroke.
 * Allows temporary typing (e.g. backspacing to empty or typing multi-digit numbers),
 * and validates/commits the final sanitized number on onBlur or Enter.
 * Pressing Escape cancels editing and restores the original value.
 */
export const NumericDimensionInput: React.FC<NumericDimensionInputProps> = ({
  label,
  value,
  min = 1,
  max = 20000,
  allowDecimals = false,
  unit,
  className = '',
  disabled = false,
  placeholder,
  onChange,
  onCommit,
  onError
}) => {
  const [internalText, setInternalText] = useState<string>(String(value ?? ''));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const initialValueRef = useRef<number>(value);

  // Sync internal string when external value updates while NOT focused
  useEffect(() => {
    if (!isFocused) {
      setInternalText(String(value ?? ''));
      initialValueRef.current = value;
    }
  }, [value, isFocused]);

  const commitValue = () => {
    const raw = internalText.trim();
    if (raw === '') {
      // Restore previous valid value
      setInternalText(String(initialValueRef.current));
      return;
    }

    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (isNaN(parsed)) {
      if (onError) onError('Please enter a valid numeric dimension');
      setInternalText(String(initialValueRef.current));
      return;
    }

    // Validate min / max bounds
    let finalVal = parsed;
    if (min !== undefined && finalVal < min) {
      finalVal = min;
      if (onError) onError(`Minimum dimension is ${min}px`);
    } else if (max !== undefined && finalVal > max) {
      finalVal = max;
      if (onError) onError(`Maximum dimension is ${max}px`);
    }

    setInternalText(String(finalVal));
    initialValueRef.current = finalVal;
    onChange(finalVal);
    if (onCommit) onCommit(finalVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Cancel and restore
      setInternalText(String(initialValueRef.current));
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const current = parseFloat(internalText) || initialValueRef.current;
      const next = Math.min(max, current + step);
      setInternalText(String(next));
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const current = parseFloat(internalText) || initialValueRef.current;
      const next = Math.max(min, current - step);
      setInternalText(String(next));
      onChange(next);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-slate-400 font-mono select-none shrink-0 font-medium">{label}</span>}
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={internalText}
        onFocus={() => {
          setIsFocused(true);
          initialValueRef.current = value;
        }}
        onChange={(e) => {
          // Allow typing digits, minus (if min < 0), and period (if decimals allowed)
          const val = e.target.value;
          // Filter out completely illegal non-numeric characters while keeping typing flow
          const sanitized = allowDecimals
            ? val.replace(/[^0-9.-]/g, '')
            : val.replace(/[^0-9-]/g, '');
          setInternalText(sanitized);
        }}
        onBlur={() => {
          setIsFocused(false);
          commitValue();
        }}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent font-mono text-white text-sm font-semibold focus:outline-hidden selection:bg-red-600/40"
      />
      {unit && <span className="text-xs text-slate-400 font-mono select-none">{unit}</span>}
    </div>
  );
};
