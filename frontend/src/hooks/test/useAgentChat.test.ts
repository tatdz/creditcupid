import { renderHook } from '@testing-library/react';
import { act as reactAct } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAgentChat } from '../useAgentChat';

describe('useAgentChat', () => {
  const address = '0x742E4C2F5D4d5F5d5F5D5f5d5f5D5f5d5f5d5f5d5f';
  
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty messages and not loading', () => {
    const { result } = renderHook(() => useAgentChat());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should add user message and assistant response', async () => {
    const { result } = renderHook(() => useAgentChat());
    
    await reactAct(async () => {
      result.current.sendMessage('Hello', address, 'advisor');
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.loading).toBe(false);
  });

  it('should clear messages', async () => {
    const { result } = renderHook(() => useAgentChat());
    
    await reactAct(async () => {
      result.current.sendMessage('Test', address, 'advisor');
      vi.advanceTimersByTime(3000);
    });
    
    reactAct(() => {
      result.current.clearMessages();
    });
    
    expect(result.current.messages).toEqual([]);
  });
});