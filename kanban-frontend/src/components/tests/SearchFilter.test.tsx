import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from '../SearchFilter';
import useTaskStore from '../../store';
import { BoardData } from '../../types';

// Mock the store
jest.mock('../../store');
const mockUseTaskStore = useTaskStore as jest.MockedFunction<typeof useTaskStore>;

const mockSetFilter = jest.fn();

const mockBoardData: BoardData = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Buy groceries',
      description: 'Get milk, bread, and eggs',
      createdAt: '2023-01-01T00:00:00Z',
    },
    'task-2': {
      id: 'task-2',
      title: 'Complete project',
      description: 'Finish the React kanban board',
      createdAt: '2023-01-02T00:00:00Z',
    },
    'task-3': {
      id: 'task-3',
      title: 'Exercise',
      createdAt: '2023-01-03T00:00:00Z',
    },
  },
  columns: {
    'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1', 'task-2'] },
    'inprogress': { id: 'inprogress', title: 'In Progress', taskIds: ['task-3'] },
    'done': { id: 'done', title: 'Done', taskIds: [] },
  },
  columnOrder: ['todo', 'inprogress', 'done'],
  history: [],
};

const mockStore = {
  filter: '',
  setFilter: mockSetFilter,
  boardData: mockBoardData,
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  moveTask: jest.fn(),
  fetchBoard: jest.fn(),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
};

describe('SearchFilter', () => {
  beforeEach(() => {
    mockUseTaskStore.mockReturnValue(mockStore);
    mockSetFilter.mockClear();
  });

  it('renders search input with placeholder', () => {
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('displays current filter value', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'groceries',
    });
    
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    expect(input).toHaveValue('groceries');
  });

  it('calls setFilter when input changes', async () => {
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    
    // Clear any previous calls
    mockSetFilter.mockClear();
    
    // Simulate typing by changing the input value directly
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Verify that setFilter was called with the final value
    expect(mockSetFilter).toHaveBeenCalledTimes(1);
    expect(mockSetFilter).toHaveBeenCalledWith('test');
    
    // Test progressive typing simulation
    mockSetFilter.mockClear();
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(mockSetFilter).toHaveBeenCalledTimes(4);
    expect(mockSetFilter).toHaveBeenNthCalledWith(1, 't');
    expect(mockSetFilter).toHaveBeenNthCalledWith(2, 'te');
    expect(mockSetFilter).toHaveBeenNthCalledWith(3, 'tes');
    expect(mockSetFilter).toHaveBeenNthCalledWith(4, 'test');
  });

  it('handles rapid typing without issues', async () => {
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    
    // Clear any previous calls
    mockSetFilter.mockClear();
    
    // Simulate rapid typing by firing change events in quick succession
    fireEvent.change(input, { target: { value: 'h' } });
    fireEvent.change(input, { target: { value: 'he' } });
    fireEvent.change(input, { target: { value: 'hel' } });
    fireEvent.change(input, { target: { value: 'hell' } });
    fireEvent.change(input, { target: { value: 'hello' } });
    
    // Verify the sequence of calls to setFilter
    expect(mockSetFilter).toHaveBeenCalledTimes(5);
    expect(mockSetFilter).toHaveBeenNthCalledWith(1, 'h');
    expect(mockSetFilter).toHaveBeenNthCalledWith(2, 'he');
    expect(mockSetFilter).toHaveBeenNthCalledWith(3, 'hel');
    expect(mockSetFilter).toHaveBeenNthCalledWith(4, 'hell');
    expect(mockSetFilter).toHaveBeenNthCalledWith(5, 'hello');
  });

  it('shows clear button when filter is active', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'groceries',
    });
    
    render(<SearchFilter />);
    
    const clearButton = screen.getByTitle('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('hides clear button when filter is empty', () => {
    render(<SearchFilter />);
    
    const clearButton = screen.queryByTitle('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('clears filter when clear button is clicked', async () => {
    const user = userEvent.setup();
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'groceries',
    });
    
    render(<SearchFilter />);
    
    const clearButton = screen.getByTitle('Clear search');
    await user.click(clearButton);
    
    expect(mockSetFilter).toHaveBeenCalledWith('');
  });

  it('shows filtered count when filter is active', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'groceries',
    });
    
    render(<SearchFilter />);
    
    // Should show "1 of 3 tasks" because "Buy groceries" matches the filter
    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument();
  });

  it('hides filtered count when filter is empty', () => {
    render(<SearchFilter />);
    
    expect(screen.queryByText(/of \d+ tasks/)).not.toBeInTheDocument();
  });

  it('shows correct filtered count for title matches', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'project',
    });
    
    render(<SearchFilter />);
    
    // "Complete project" should match
    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument();
  });

  it('shows correct filtered count for description matches', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'React',
    });
    
    render(<SearchFilter />);
    
    // "Finish the React kanban board" in description should match
    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument();
  });

  it('shows correct filtered count for case-insensitive matches', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'GROCERIES',
    });
    
    render(<SearchFilter />);
    
    // Should match "Buy groceries" case-insensitively
    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument();
  });

  it('shows no results message when no tasks match filter', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'nonexistent',
    });
    
    render(<SearchFilter />);
    
    expect(screen.getByText('No tasks found matching "nonexistent"')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 tasks')).toBeInTheDocument();
  });

  it('handles null boardData gracefully', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: null,
      filter: 'test',
    });
    
    render(<SearchFilter />);
    
    expect(screen.getByText('0 of 0 tasks')).toBeInTheDocument();
  });

  it('handles empty tasks object', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        tasks: {},
      },
      filter: 'test',
    });
    
    render(<SearchFilter />);
    
    expect(screen.getByText('0 of 0 tasks')).toBeInTheDocument();
  });

  it('counts tasks correctly with no filter', () => {
    render(<SearchFilter />);
    
    // Should not show count when no filter is active
    expect(screen.queryByText('3 of 3 tasks')).not.toBeInTheDocument();
  });

  it('handles tasks without descriptions', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'Exercise',
    });
    
    render(<SearchFilter />);
    
    // "Exercise" task has no description but should still match title
    expect(screen.getByText('1 of 3 tasks')).toBeInTheDocument();
  });

  it('matches partial strings in both title and description', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      filter: 'e', // Should match "Complete project", "Exercise", and "Get milk, bread, and eggs"
    });
    
    render(<SearchFilter />);
    
    expect(screen.getByText('3 of 3 tasks')).toBeInTheDocument();
  });

  it('shows correct styling for search input', () => {
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    expect(input).toHaveClass(
      'w-full',
      'pl-10',
      'pr-4',
      'py-2',
      'border',
      'border-gray-300',
      'rounded-lg',
      'text-sm'
    );
  });

  it('maintains focus on input during typing', async () => {
    const user = userEvent.setup();
    render(<SearchFilter />);
    
    const input = screen.getByPlaceholderText('Search tasks by title or description...');
    await user.click(input);
    expect(input).toHaveFocus();
    
    await user.type(input, 'test');
    expect(input).toHaveFocus();
  });
});
