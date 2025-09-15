import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import useTaskStore from './store';
import { BoardData } from './types';

// Mock the store
jest.mock('./store');
const mockUseTaskStore = useTaskStore as jest.MockedFunction<typeof useTaskStore>;

// Mock child components
jest.mock('./components/Column', () => {
  return function MockColumn({ column, tasks }: any) {
    return (
      <div data-testid={`column-${column.id}`}>
        <h3>{column.title}</h3>
        <div data-testid={`tasks-count-${column.id}`}>{tasks.length} tasks</div>
        {tasks.map((task: any) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.title}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('./components/AddTaskForm', () => {
  return function MockAddTaskForm({ autoFocus }: { autoFocus?: boolean }) {
    return (
      <div data-testid="add-task-form" data-autofocus={autoFocus}>
        Add Task Form
      </div>
    );
  };
});

jest.mock('./components/SearchFilter', () => {
  return function MockSearchFilter() {
    return <div data-testid="search-filter">Search Filter</div>;
  };
});

jest.mock('./components/TaskHistory', () => {
  return function MockTaskHistory() {
    return <div data-testid="task-history">Task History</div>;
  };
});

// Mock drag and drop
const mockOnDragEnd = jest.fn();
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => {
    mockOnDragEnd.mockImplementation(onDragEnd);
    return <div data-testid="drag-drop-context">{children}</div>;
  },
}));

const mockFetchBoard = jest.fn();
const mockMoveTask = jest.fn();
const mockClearError = jest.fn();

const baseMockStore = {
  boardData: null,
  isLoading: false,
  error: null,
  filter: '',
  fetchBoard: mockFetchBoard,
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  moveTask: mockMoveTask,
  setFilter: jest.fn(),
  clearError: mockClearError,
};

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
      description: 'Description 2',
      createdAt: '2024-01-02T00:00:00Z',
    },
    'task-3': {
      id: 'task-3',
      title: 'Another task',
      createdAt: '2024-01-03T00:00:00Z',
    },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1', 'task-3'],
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

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTaskStore.mockReturnValue(baseMockStore);
  });

  describe('Error State', () => {
    const errorMessage = 'Failed to connect to server';

    beforeEach(() => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        error: errorMessage,
      });
    });

    it('renders error state when error exists', () => {
      render(<App />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Make sure the backend server is running on port 5000')).toBeInTheDocument();
    });

    it('handles try again button click', async () => {
      const user = userEvent.setup();
      render(<App />);

      const tryAgainButton = screen.getByText('Try Again');
      await user.click(tryAgainButton);

      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(mockFetchBoard).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    });
  });

  describe('No Data State', () => {
    it('renders no data state when boardData is null and not loading', () => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: null,
        isLoading: false,
        error: null,
      });

      render(<App />);

      expect(screen.getByText('No board data available')).toBeInTheDocument();
    });
  });

  describe('Main Board State', () => {
    beforeEach(() => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
      });
    });

    it('renders main kanban board with all components', () => {
      render(<App />);

      // Header
      expect(screen.getByText('Personal Kanban Board with Persistent State')).toBeInTheDocument();
      expect(screen.getByText('Organize your tasks with drag-and-drop simplicity')).toBeInTheDocument();

      // Controls
      expect(screen.getByTestId('add-task-form')).toBeInTheDocument();
      expect(screen.getByTestId('add-task-form')).toHaveAttribute('data-autofocus', 'true');
      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
      expect(screen.getByTestId('task-history')).toBeInTheDocument();

      // Columns
      expect(screen.getByTestId('column-column-1')).toBeInTheDocument();
      expect(screen.getByTestId('column-column-2')).toBeInTheDocument();
      expect(screen.getByTestId('column-column-3')).toBeInTheDocument();

      // Footer
      expect(screen.getByText('Built with React, TypeScript, and Express for CRED')).toBeInTheDocument();

      // Drag and drop context
      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    });

    it('renders columns in correct order', () => {
      render(<App />);

      const columns = screen.getAllByText(/To Do|In Progress|Done/);
      expect(columns[0]).toHaveTextContent('To Do');
      expect(columns[1]).toHaveTextContent('In Progress');
      expect(columns[2]).toHaveTextContent('Done');
    });

    it('displays tasks in correct columns', () => {
      render(<App />);

      // Column 1 should have 2 tasks
      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('2 tasks');
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-task-3')).toBeInTheDocument();

      // Column 2 should have 1 task
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('1 tasks');
      expect(screen.getByTestId('task-task-2')).toBeInTheDocument();

      // Column 3 should have 0 tasks
      expect(screen.getByTestId('tasks-count-column-3')).toHaveTextContent('0 tasks');
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
        filter: 'Task 1',
      });
    });

    it('filters tasks by title', () => {
      render(<App />);

      // Column 1 should now have 1 task (only Task 1 matches)
      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('1 tasks');
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-task-3')).not.toBeInTheDocument();

      // Column 2 should have 0 tasks (Task 2 doesn't match)
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('0 tasks');
    });

    it('filters tasks by description', () => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
        filter: 'Description 2',
      });

      render(<App />);

      // Column 1 should have 0 tasks
      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('0 tasks');

      // Column 2 should have 1 task (Task 2 has matching description)
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('1 tasks');
      expect(screen.getByTestId('task-task-2')).toBeInTheDocument();
    });

    it('is case insensitive', () => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
        filter: 'task 1',
      });

      render(<App />);

      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('1 tasks');
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
    });

    it('shows all tasks when filter is empty', () => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
        filter: '',
      });

      render(<App />);

      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('2 tasks');
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('1 tasks');
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: mockBoardData,
      });
    });

    it('handles drag end with no destination', () => {
      render(<App />);

      const dropResult = {
        destination: null,
        source: { droppableId: 'column-1', index: 0 },
        draggableId: 'task-1',
      };

      mockOnDragEnd(dropResult);

      expect(mockMoveTask).not.toHaveBeenCalled();
    });

    it('handles drag end to same position', () => {
      render(<App />);

      const dropResult = {
        destination: { droppableId: 'column-1', index: 0 },
        source: { droppableId: 'column-1', index: 0 },
        draggableId: 'task-1',
      };

      mockOnDragEnd(dropResult);

      expect(mockMoveTask).not.toHaveBeenCalled();
    });

    it('handles successful drag and drop within same column', () => {
      render(<App />);

      const dropResult = {
        destination: { droppableId: 'column-1', index: 1 },
        source: { droppableId: 'column-1', index: 0 },
        draggableId: 'task-1',
      };

      mockOnDragEnd(dropResult);

      expect(mockMoveTask).toHaveBeenCalledWith(
        'task-1',
        'column-1',
        'column-1',
        0,
        1
      );
    });

    it('handles successful drag and drop between columns', () => {
      render(<App />);

      const dropResult = {
        destination: { droppableId: 'column-2', index: 0 },
        source: { droppableId: 'column-1', index: 0 },
        draggableId: 'task-1',
      };

      mockOnDragEnd(dropResult);

      expect(mockMoveTask).toHaveBeenCalledWith(
        'task-1',
        'column-1',
        'column-2',
        0,
        0
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles boardData with no tasks', () => {
      const emptyBoardData = {
        ...mockBoardData,
        tasks: {},
      };

      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: emptyBoardData,
      });

      render(<App />);

      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('0 tasks');
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('0 tasks');
      expect(screen.getByTestId('tasks-count-column-3')).toHaveTextContent('0 tasks');
    });

    it('handles boardData with empty columns', () => {
      const emptyColumnsData = {
        ...mockBoardData,
        columns: {
          'column-1': { ...mockBoardData.columns['column-1'], taskIds: [] },
          'column-2': { ...mockBoardData.columns['column-2'], taskIds: [] },
          'column-3': { ...mockBoardData.columns['column-3'], taskIds: [] },
        },
      };

      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: emptyColumnsData,
      });

      render(<App />);

      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('0 tasks');
      expect(screen.getByTestId('tasks-count-column-2')).toHaveTextContent('0 tasks');
      expect(screen.getByTestId('tasks-count-column-3')).toHaveTextContent('0 tasks');
    });

    it('handles tasks with no description', () => {
      const taskWithoutDescription = {
        ...mockBoardData.tasks['task-1'],
        description: undefined,
      };

      const modifiedBoardData = {
        ...mockBoardData,
        tasks: {
          ...mockBoardData.tasks,
          'task-1': taskWithoutDescription,
        },
      };

      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: modifiedBoardData,
        filter: 'Description 1',
      });

      render(<App />);

      // Task 1 should not match since it has no description
      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('0 tasks');
    });

    it('handles filtering with special characters', () => {
      const specialCharTask = {
        id: 'task-special',
        title: 'Task with @#$%^&* characters',
        createdAt: '2024-01-04T00:00:00Z',
      };

      const modifiedBoardData = {
        ...mockBoardData,
        tasks: {
          ...mockBoardData.tasks,
          'task-special': specialCharTask,
        },
        columns: {
          ...mockBoardData.columns,
          'column-1': {
            ...mockBoardData.columns['column-1'],
            taskIds: ['task-1', 'task-3', 'task-special'],
          },
        },
      };

      mockUseTaskStore.mockReturnValue({
        ...baseMockStore,
        boardData: modifiedBoardData,
        filter: '@#$%',
      });

      render(<App />);

      expect(screen.getByTestId('tasks-count-column-1')).toHaveTextContent('1 tasks');
    });
  });
});
