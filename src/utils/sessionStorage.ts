export const SESSION_STORAGE_KEY = 'todos';

import type { Todo } from '../types/Todo';

/**
 * Runtime type guard that checks whether the provided value is an array of
 * objects that satisfy the minimal `Todo` shape we care about for persistence.
 */
export const isValidTodos = (data: unknown): data is Todo[] => {
  return (
    Array.isArray(data) &&
    data.every(t => {
      if (typeof t !== 'object' || t === null) return false;
      const obj = t as Record<string, unknown>;
      return (
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.completed === 'boolean'
      );
    })
  );
};

/**
 * Loads todos from `window.sessionStorage`. If the stored value is missing,
 * corrupt, or fails validation the key is cleared and an empty array is
 * returned.
 */
export const loadTodos = (): Todo[] => {
  if (typeof window === 'undefined' || !window.sessionStorage) return [];

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!isValidTodos(parsed)) throw new Error('Invalid data');

    // Rehydrate `createdAt` back into Date instances. We know the shape at
    // this point thanks to the type guard, but `createdAt` is still a string
    // after JSON.parse – convert it back.
    type PersistedTodo = Omit<Todo, 'createdAt'> & { createdAt: string };
    return (parsed as unknown as PersistedTodo[]).map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
    }));
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return [];
  }
};

/**
 * Persists the given todos array to `window.sessionStorage`.
 * Returns `true` if the write succeeded or `false` if a QuotaExceededError was
 * encountered. Any other error is re-thrown because something genuinely
 * unexpected happened.
 */
export const saveTodos = (todos: Todo[]): boolean => {
  if (typeof window === 'undefined' || !window.sessionStorage) return true;

  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (err: unknown) {
    const isQuotaError =
      (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'QuotaExceededError') ||
      (err instanceof DOMException && err.code === 22);

    if (isQuotaError) {
      // Swallow quota errors – caller can decide how to surface to the user.
      console.warn(
        'Storage quota exceeded – your latest changes may not be saved.'
      );
      return false;
    }

    // Bubble up any other type of failure – this should be extremely rare.
    throw err;
  }
};