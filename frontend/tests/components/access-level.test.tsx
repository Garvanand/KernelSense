import { renderHook, act } from '@testing-library/react';
import { useAccessLevel } from '@/lib/store/access-level';

describe('useAccessLevel Zustand Store', () => {
  beforeEach(() => {
    // Reset state before each test
    act(() => {
      useAccessLevel.getState().setLevel('guest');
    });
  });

  it('should default to guest level', () => {
    const { result } = renderHook(() => useAccessLevel());
    expect(result.current.level).toBe('guest');
  });

  it('should correctly set the access level', () => {
    const { result } = renderHook(() => useAccessLevel());
    
    act(() => {
      result.current.setLevel('kernel');
    });
    
    expect(result.current.level).toBe('kernel');
  });

  it('should allow research clearance', () => {
    const { result } = renderHook(() => useAccessLevel());
    
    act(() => {
      result.current.setLevel('research');
    });
    
    expect(result.current.level).toBe('research');
  });
});
