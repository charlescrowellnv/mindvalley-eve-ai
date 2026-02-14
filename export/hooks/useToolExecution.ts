'use client';

import { useState, useCallback } from 'react';
import { ToolExecution, ToolExecutionState } from '@/lib/types';
import { nanoid } from 'nanoid';

export function useToolExecution() {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);

  const addExecution = useCallback((
    toolName: string,
    parameters: Record<string, unknown>
  ): string => {
    const id = nanoid();
    const execution: ToolExecution = {
      id,
      toolName,
      parameters,
      state: 'pending',
      timestamp: Date.now(),
    };

    setExecutions(prev => [...prev, execution]);
    return id;
  }, []);

  const updateExecution = useCallback((
    id: string,
    updates: Partial<Omit<ToolExecution, 'id' | 'toolName' | 'parameters' | 'timestamp'>>
  ) => {
    setExecutions(prev =>
      prev.map(exec =>
        exec.id === id ? { ...exec, ...updates } : exec
      )
    );
  }, []);

  const clearExecutions = useCallback(() => {
    setExecutions([]);
  }, []);

  return {
    executions,
    addExecution,
    updateExecution,
    clearExecutions,
  };
}
