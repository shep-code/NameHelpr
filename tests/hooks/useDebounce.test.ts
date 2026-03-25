import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('delays value update by specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial'); // Not yet

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('updated'); // Now updated
  });

  it('cancels pending update on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    unmount();
    // No error should occur - timeout was cleaned up
    act(() => { vi.advanceTimersByTime(300); });
  });

  it('resets timer when value changes before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'v1' } }
    );

    rerender({ value: 'v2' });
    act(() => { vi.advanceTimersByTime(200); }); // Only 200ms
    expect(result.current).toBe('v1'); // Still old

    rerender({ value: 'v3' });
    act(() => { vi.advanceTimersByTime(200); }); // Another 200ms (400 total, but timer reset)
    expect(result.current).toBe('v1'); // Still old - timer reset

    act(() => { vi.advanceTimersByTime(100); }); // Now 300ms since v3
    expect(result.current).toBe('v3'); // Updated to latest
  });
});
