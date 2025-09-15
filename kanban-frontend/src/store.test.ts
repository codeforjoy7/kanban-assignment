import { act } from '@testing-library/react';
import useTaskStore from './store';
import { BoardData } from './types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console.error to suppress error messages in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:5000/api';

const mockBoardData: BoardData = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      createdAt: '2024-01-01T00:00:00Z',
    },
    'task-2': {
      id: 'task-2',
      title: 'Task 2',
      createdAt: '2024-01-02T00:00:00Z',
    },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-2'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Done',
      taskIds: [],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
  history: [],
};

describe('useTaskStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockFetch.mockClear();
    consoleErrorSpy.mockClear();
    
    // Reset store state
    act(() => {
      useTaskStore.setState({
        boardData: null,
        isLoading: false,
        error: null,
        filter: '',
      });
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useTaskStore.getState();
      
      expect(state.boardData).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.filter).toBe('');
    });

    it('provides all required actions', () => {
      const state = useTaskStore.getState();
      
      expect(typeof state.fetchBoard).toBe('function');
      expect(typeof state.createTask).toBe('function');
      expect(typeof state.updateTask).toBe('function');
      expect(typeof state.deleteTask).toBe('function');
      expect(typeof state.moveTask).toBe('function');
      expect(typeof state.setFilter).toBe('function');
      expect(typeof state.clearError).toBe('function');
    });
  });

  describe('fetchBoard', () => {
    it('successfully fetches board data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockBoardData),
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { fetchBoard } = useTaskStore.getState();
      
      // Check loading state is set
      const fetchPromise = fetchBoard();
      expect(useTaskStore.getState().isLoading).toBe(true);
      expect(useTaskStore.getState().error).toBe(null);
      
      await act(async () => {
        await fetchPromise;
      });

      const state = useTaskStore.getState();
      expect(state.boardData).toEqual(mockBoardData);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/board');
    });

    it('handles fetch error with error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { fetchBoard } = useTaskStore.getState();

      await act(async () => {
        await fetchBoard();
      });

      const state = useTaskStore.getState();
      expect(state.boardData).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('HTTP error! status: 500');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching board:', expect.any(Error));
    });

    it('handles network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { fetchBoard } = useTaskStore.getState();

      await act(async () => {
        await fetchBoard();
      });

      const state = useTaskStore.getState();
      expect(state.boardData).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching board:', networkError);
    });

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { fetchBoard } = useTaskStore.getState();

      await act(async () => {
        await fetchBoard();
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to fetch board data');
    });
  });

  describe('createTask', () => {
    const mockFetchBoard = jest.fn();
    
    beforeEach(() => {
      // Mock the fetchBoard method on the store
      useTaskStore.setState({
        fetchBoard: mockFetchBoard,
      });
    });

    it('successfully creates a task', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'new-task-id' }),
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { createTask } = useTaskStore.getState();

      await act(async () => {
        await createTask('New Task', 'New Description');
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Task', description: 'New Description' }),
      });
      
      expect(mockFetchBoard).toHaveBeenCalledTimes(1);
      expect(useTaskStore.getState().error).toBe(null);
    });

    it('creates task without description', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'new-task-id' }),
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { createTask } = useTaskStore.getState();

      await act(async () => {
        await createTask('New Task');
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Task', description: undefined }),
      });
    });

    it('handles create task error with error response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { createTask } = useTaskStore.getState();

      await act(async () => {
        await createTask('New Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('HTTP error! status: 400');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating task:', expect.any(Error));
      expect(mockFetchBoard).not.toHaveBeenCalled();
    });

    it('handles create task network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { createTask } = useTaskStore.getState();

      await act(async () => {
        await createTask('New Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating task:', networkError);
    });

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { createTask } = useTaskStore.getState();

      await act(async () => {
        await createTask('New Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to create task');
    });
  });

  describe('updateTask', () => {
    const mockFetchBoard = jest.fn();
    
    beforeEach(() => {
      useTaskStore.setState({
        fetchBoard: mockFetchBoard,
      });
    });

    it('successfully updates a task', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({}),
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { updateTask } = useTaskStore.getState();

      await act(async () => {
        await updateTask('task-1', 'Updated Task', 'Updated Description');
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks/task-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated Task', description: 'Updated Description' }),
      });
      
      expect(mockFetchBoard).toHaveBeenCalledTimes(1);
      expect(useTaskStore.getState().error).toBe(null);
    });

    it('handles update task error', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { updateTask } = useTaskStore.getState();

      await act(async () => {
        await updateTask('task-1', 'Updated Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('HTTP error! status: 404');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating task:', expect.any(Error));
    });

    it('handles update task network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { updateTask } = useTaskStore.getState();

      await act(async () => {
        await updateTask('task-1', 'Updated Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Network error');
    });

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { updateTask } = useTaskStore.getState();

      await act(async () => {
        await updateTask('task-1', 'Updated Task');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to update task');
    });
  });

  describe('deleteTask', () => {
    const mockFetchBoard = jest.fn();
    
    beforeEach(() => {
      useTaskStore.setState({
        fetchBoard: mockFetchBoard,
      });
    });

    it('successfully deletes a task', async () => {
      const mockResponse = {
        ok: true,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { deleteTask } = useTaskStore.getState();

      await act(async () => {
        await deleteTask('task-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks/task-1', {
        method: 'DELETE',
      });
      
      expect(mockFetchBoard).toHaveBeenCalledTimes(1);
      expect(useTaskStore.getState().error).toBe(null);
    });

    it('handles delete task error', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { deleteTask } = useTaskStore.getState();

      await act(async () => {
        await deleteTask('task-1');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('HTTP error! status: 404');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting task:', expect.any(Error));
    });

    it('handles delete task network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { deleteTask } = useTaskStore.getState();

      await act(async () => {
        await deleteTask('task-1');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Network error');
    });

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { deleteTask } = useTaskStore.getState();

      await act(async () => {
        await deleteTask('task-1');
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to delete task');
    });
  });

  describe('moveTask', () => {
    const mockFetchBoard = jest.fn();
    
    beforeEach(() => {
      // Set up initial board data for move operations
      useTaskStore.setState({
        boardData: mockBoardData,
        fetchBoard: mockFetchBoard,
      });
    });

    it('successfully moves task within same column', async () => {
      const mockResponse = {
        ok: true,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { moveTask } = useTaskStore.getState();

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-1', 0, 0);
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks/task-1/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceColumnId: 'column-1',
          destColumnId: 'column-1',
          sourceIndex: 0,
          destIndex: 0,
        }),
      });

      expect(useTaskStore.getState().error).toBe(null);
      expect(mockFetchBoard).not.toHaveBeenCalled(); // Should not refetch on success
    });

    it('successfully moves task between different columns with optimistic update', async () => {
      const mockResponse = {
        ok: true,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { moveTask } = useTaskStore.getState();

      // Get initial state
      const initialState = useTaskStore.getState();
      expect(initialState.boardData!.columns['column-1'].taskIds).toEqual(['task-1']);
      expect(initialState.boardData!.columns['column-2'].taskIds).toEqual(['task-2']);

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 1);
      });

      // Check optimistic update was applied
      const state = useTaskStore.getState();
      expect(state.boardData!.columns['column-1'].taskIds).toEqual([]);
      expect(state.boardData!.columns['column-2'].taskIds).toEqual(['task-2', 'task-1']);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks/task-1/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceColumnId: 'column-1',
          destColumnId: 'column-2',
          sourceIndex: 0,
          destIndex: 1,
        }),
      });
      
      expect(mockFetchBoard).not.toHaveBeenCalled(); // Should not refetch on success
    });

    it('handles move task error and reverts optimistic update', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { moveTask } = useTaskStore.getState();

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 0);
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('HTTP error! status: 400');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error moving task:', expect.any(Error));
      expect(mockFetchBoard).toHaveBeenCalledTimes(1); // Should refetch to revert optimistic update
    });

    it('handles move task network error and reverts optimistic update', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { moveTask } = useTaskStore.getState();

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 0);
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error moving task:', networkError);
      expect(mockFetchBoard).toHaveBeenCalledTimes(1);
    });

    it('handles non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('String error');
      mockFetchBoard.mockResolvedValueOnce(undefined);

      const { moveTask } = useTaskStore.getState();

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 0);
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe('Failed to move task');
    });

    it('handles move task when boardData is null', async () => {
      // Set boardData to null
      useTaskStore.setState({
        boardData: null,
      });

      const mockResponse = {
        ok: true,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { moveTask } = useTaskStore.getState();

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 0);
      });

      // Should still make the API call even without boardData
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/tasks/task-1/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceColumnId: 'column-1',
          destColumnId: 'column-2',
          sourceIndex: 0,
          destIndex: 0,
        }),
      });
    });

    it('creates deep copies of columns to avoid mutation', async () => {
      const mockResponse = {
        ok: true,
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { moveTask } = useTaskStore.getState();
      
      // Get reference to original taskIds array
      const originalColumn1TaskIds = useTaskStore.getState().boardData!.columns['column-1'].taskIds;
      const originalColumn2TaskIds = useTaskStore.getState().boardData!.columns['column-2'].taskIds;

      await act(async () => {
        await moveTask('task-1', 'column-1', 'column-2', 0, 0);
      });

      const state = useTaskStore.getState();
      
      // Verify original arrays weren't mutated
      expect(originalColumn1TaskIds).toEqual(['task-1']); // Original unchanged
      expect(originalColumn2TaskIds).toEqual(['task-2']); // Original unchanged
      
      // Verify new state has correct values
      expect(state.boardData!.columns['column-1'].taskIds).toEqual([]);
      expect(state.boardData!.columns['column-2'].taskIds).toEqual(['task-1', 'task-2']);
      
      // Verify these are different array references
      expect(state.boardData!.columns['column-1'].taskIds).not.toBe(originalColumn1TaskIds);
      expect(state.boardData!.columns['column-2'].taskIds).not.toBe(originalColumn2TaskIds);
    });
  });

  describe('Synchronous Actions', () => {
    it('setFilter updates filter state', () => {
      const { setFilter } = useTaskStore.getState();
      
      act(() => {
        setFilter('test filter');
      });

      const state = useTaskStore.getState();
      expect(state.filter).toBe('test filter');
    });

    it('setFilter can clear filter', () => {
      // First set a filter
      act(() => {
        useTaskStore.setState({ filter: 'existing filter' });
      });

      const { setFilter } = useTaskStore.getState();
      
      act(() => {
        setFilter('');
      });

      const state = useTaskStore.getState();
      expect(state.filter).toBe('');
    });

    it('clearError removes error state', () => {
      // First set an error
      act(() => {
        useTaskStore.setState({ error: 'Some error message' });
      });

      const { clearError } = useTaskStore.getState();
      
      act(() => {
        clearError();
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe(null);
    });

    it('clearError when no error exists', () => {
      const { clearError } = useTaskStore.getState();
      
      act(() => {
        clearError();
      });

      const state = useTaskStore.getState();
      expect(state.error).toBe(null);
    });
  });

  describe('State Persistence and Integration', () => {
    it('maintains state consistency across multiple operations', async () => {
      const { setFilter, clearError } = useTaskStore.getState();
      
      // Set initial state
      act(() => {
        useTaskStore.setState({
          boardData: mockBoardData,
          filter: 'initial filter',
          error: 'some error',
        });
      });

      // Perform multiple operations
      act(() => {
        setFilter('new filter');
        clearError();
      });

      const state = useTaskStore.getState();
      expect(state.filter).toBe('new filter');
      expect(state.error).toBe(null);
      expect(state.boardData).toEqual(mockBoardData); // Should remain unchanged
    });

    it('state updates are isolated between different actions', () => {
      const { setFilter, clearError } = useTaskStore.getState();
      
      // Set multiple state properties
      act(() => {
        useTaskStore.setState({
          filter: 'test filter',
          error: 'test error',
          isLoading: true,
          boardData: mockBoardData,
        });
      });

      // Verify all states are set
      let state = useTaskStore.getState();
      expect(state.filter).toBe('test filter');
      expect(state.error).toBe('test error');
      expect(state.isLoading).toBe(true);
      expect(state.boardData).toEqual(mockBoardData);

      // Clear error should only affect error state
      act(() => {
        clearError();
      });

      state = useTaskStore.getState();
      expect(state.filter).toBe('test filter'); // unchanged
      expect(state.error).toBe(null); // cleared
      expect(state.isLoading).toBe(true); // unchanged
      expect(state.boardData).toEqual(mockBoardData); // unchanged

      // Set filter should only affect filter state
      act(() => {
        setFilter('new filter');
      });

      state = useTaskStore.getState();
      expect(state.filter).toBe('new filter'); // changed
      expect(state.error).toBe(null); // still null
      expect(state.isLoading).toBe(true); // unchanged
      expect(state.boardData).toEqual(mockBoardData); // unchanged
    });
  });
});
