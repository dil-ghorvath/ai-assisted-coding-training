import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, SESSION_STORAGE_KEY } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

const sampleTodo: Todo = {
  id: '1',
  title: 'Sample',
  description: 'Desc',
  completed: false,
  createdAt: new Date(),
};

describe('sessionStorage helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('loadTodos returns empty array when key is missing', () => {
    expect(loadTodos()).toEqual([]);
  });

  it('loadTodos returns data when valid JSON present', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify([sampleTodo]));
    const todos = loadTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe(sampleTodo.id);
  });

  it('loadTodos clears and returns empty on corrupt JSON', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '{invalid');
    const todos = loadTodos();
    expect(todos).toEqual([]);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('saveTodos handles quota errors gracefully', () => {
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Override setItem to always throw a quota error
    const err = new Error('Quota exceeded') as Error & { name: string };
    err.name = 'QuotaExceededError';
    const setItemMock = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw err;
      });

    const ok = saveTodos([sampleTodo]);
    expect(ok).toBe(false);
    expect(spyWarn).toHaveBeenCalled();

    // Restore original implementation
    setItemMock.mockRestore();
  });
});