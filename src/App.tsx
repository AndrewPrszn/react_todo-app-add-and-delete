/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { getTodos } from './api/todos';
import { addTodo } from './api/todos';
import { deleteTodo } from './api/todos';

enum ErrorMessage {
  Load = 'Unable to load todos',
  Add = 'Unable to add a todo',
  Delete = 'Unable to delete a todo',
  EmptyTitle = 'Title should not be empty',
}

enum Filter {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

export const App: React.FC = () => {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [tempTodo, setTempTodo] = React.useState<Todo | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deleteIds, setDeleteIds] = React.useState<number[]>([]);

  const activeCount = todos.filter(todo => !todo.completed).length;
  const allCompleted = todos.length > 0 && activeCount === 0;
  const hasCompleted = todos.some(todo => todo.completed);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadTodos = async () => {
    setError(null);

    try {
      const data = await getTodos();

      setTodos(data);
    } catch (e) {
      setError(ErrorMessage.Load);
    } finally {
    }
  };

  const [filter, setFilter] = React.useState<Filter>(Filter.All);
  const filters = [
    { label: 'All', value: Filter.All, href: '#/' },
    { label: 'Active', value: Filter.Active, href: '#/active' },
    { label: 'Completed', value: Filter.Completed, href: '#/completed' },
  ];

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => {
      setError(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    inputRef.current?.focus();
  });

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case Filter.Active:
        return todos.filter(todo => !todo.completed);

      case Filter.Completed:
        return todos.filter(todo => todo.completed);

      default:
        return todos;
    }
  }, [todos, filter]);

  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newTitle.trim();

    if (!trimmed) {
      setError(ErrorMessage.EmptyTitle);

      return;
    }

    const temp: Todo = {
      id: 0,
      title: trimmed,
      completed: false,
      userId: USER_ID,
    };

    setTempTodo(temp);
    setIsAdding(true);

    try {
      const created = await addTodo({
        title: trimmed,
        completed: false,
        userId: USER_ID,
      });

      setTodos(prev => [...prev, created]);
      setNewTitle('');
    } catch (event) {
      setError(ErrorMessage.Add);
    } finally {
      setTempTodo(null);
      setIsAdding(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setDeleteIds(prev => [...prev, id]);

    try {
      await deleteTodo(id);

      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch {
      setError(ErrorMessage.Delete);
    } finally {
      setDeleteIds(prev => prev.filter(deleteId => deleteId !== id));
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    const results = await Promise.allSettled(
      completedTodos.map(todo => deleteTodo(todo.id)),
    );

    const successfulIds: number[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulIds.push(completedTodos[index].id);
      }
    });

    setTodos(prev => prev.filter(todo => !successfulIds.includes(todo.id)));

    if (results.some(r => r.status === 'rejected')) {
      setError(ErrorMessage.Delete);
    }
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className={`todoapp__toggle-all ${allCompleted ? 'active' : ''}`}
            data-cy="ToggleAllButton"
            disabled={todos.length === 0}
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleAddTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              disabled={isAdding}
              ref={inputRef}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {visibleTodos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={`todo ${todo.completed ? 'completed' : ''}`}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  readOnly
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => handleDeleteTodo(todo.id)}
              >
                ×
              </button>
              <div
                data-cy="TodoLoader"
                className={`modal overlay ${deleteIds.includes(todo.id) ? 'is-active' : 'is-hidden'}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
          {tempTodo && (
            <div data-cy="Todo" className="todo">
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  disabled
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <button type="button" className="todo__remove">
                ×
              </button>
              <div
                data-cy="TodoLoader"
                className={`modal overlay ${isAdding ? 'is-active' : ''}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeCount} items left
            </span>
            {/* Active link should have the 'selected' class */}

            <nav className="filter" data-cy="Filter">
              {filters.map(f => (
                <a
                  key={f.value}
                  href={f.href}
                  className={`filter__link ${filter === f.value ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    setFilter(f.value);
                  }}
                  data-cy={`FilterLink${f.label}`}
                >
                  {f.label}
                </a>
              ))}
            </nav>
            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!hasCompleted}
              onClick={handleClearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${
          error ? '' : 'hidden'
        }`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError(null)}
        />

        {error}
      </div>
    </div>
  );
};
