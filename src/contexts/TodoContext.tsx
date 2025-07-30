import React, { useEffect, useState } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';
import { loadTodos, saveTodos } from '../utils/sessionStorage';
import { useToast } from './ToastContext';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hydrate from sessionStorage on initial mount
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());

  const showToast = useToast();

  const addTodo = (title: string, description: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Persist every change to sessionStorage
  useEffect(() => {
    const success = saveTodos(todos);
    if (!success) {
      showToast(
        'Storage quota exceeded – your latest changes may not be saved.',
        'warning'
      );
    }
  }, [todos, showToast]);

  return (
    <TodoContext.Provider
      value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}
    >
      {children}
    </TodoContext.Provider>
  );
};

// No re-exports to avoid react-refresh/only-export-components error