import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTaskForm from '../AddTaskForm';
import useTaskStore from '../../store';

// Mock the store
jest.mock('../../store');
const mockUseTaskStore = useTaskStore as jest.MockedFunction<typeof useTaskStore>;

const mockCreateTask = jest.fn();
const mockStore = {
  createTask: mockCreateTask,
  error: null,
  boardData: null,
  isLoading: false,
  filter: '',
  fetchBoard: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  moveTask: jest.fn(),
  setFilter: jest.fn(),
  clearError: jest.fn(),
};

describe('AddTaskForm', () => {
  beforeEach(() => {
    mockUseTaskStore.mockReturnValue(mockStore);
    mockCreateTask.mockClear();
  });

  it('renders with initial state', () => {
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveFocus();
    
    // Should not show expanded form initially
    expect(screen.queryByPlaceholderText('Description (optional)...')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
  });

  it('focuses input when autoFocus is true', () => {
    render(<AddTaskForm autoFocus />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    expect(input).toHaveFocus();
  });

  it('expands form when input is focused', async () => {
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.focus(input);
    
    // Should show expanded form
    expect(screen.getByPlaceholderText('Description (optional)...')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\/Cmd \+ Enter/)).toBeInTheDocument();
  });

  it('handles input changes correctly', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    expect(input).toHaveValue('Test task');
    
    const textarea = screen.getByPlaceholderText('Description (optional)...');
    await user.type(textarea, 'Test description');
    
    expect(textarea).toHaveValue('Test description');
  });

  it('submits form with title only', async () => {
    mockCreateTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith('Test task', undefined);
    });
  });

  it('submits form with title and description', async () => {
    mockCreateTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    const textarea = screen.getByPlaceholderText('Description (optional)...');
    await user.type(textarea, 'Test description');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith('Test task', 'Test description');
    });
  });

  it('trims whitespace from inputs', async () => {
    mockCreateTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, '  Test task  ');
    
    const textarea = screen.getByPlaceholderText('Description (optional)...');
    await user.type(textarea, '  Test description  ');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith('Test task', 'Test description');
    });
  });

  it('prevents submission with empty title', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    
    const submitButton = screen.getByText('Add Task');
    expect(submitButton).toBeDisabled();
    
    await user.click(submitButton);
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('prevents submission with whitespace-only title', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, '   ');
    
    const submitButton = screen.getByText('Add Task');
    expect(submitButton).toBeDisabled();
  });

  it('cancels form and resets state', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    const textarea = screen.getByPlaceholderText('Description (optional)...');
    await user.type(textarea, 'Test description');
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    // Form should collapse
    expect(screen.queryByPlaceholderText('Description (optional)...')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    
    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('handles keyboard shortcuts', async () => {
    mockCreateTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    // Test Ctrl+Enter submission
    await user.keyboard('{Control>}{Enter}{/Control}');
    
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith('Test task', undefined);
    });
  });

  it('handles Escape key to cancel', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    await user.keyboard('{Escape}');
    
    // Form should collapse and be cleared
    expect(screen.queryByPlaceholderText('Description (optional)...')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('shows loading state during submission', async () => {
    let resolveCreateTask: () => void;
    const createTaskPromise = new Promise<void>((resolve) => {
      resolveCreateTask = resolve;
    });
    mockCreateTask.mockReturnValue(createTaskPromise);
    
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByText('Adding...')).toBeDisabled();
    expect(input).toBeDisabled();
    
    resolveCreateTask!();
    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument();
    });
  });

  it('displays error message when present', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      error: 'Failed to create task',
    });
    
    render(<AddTaskForm />);
    
    expect(screen.getByText('Failed to create task')).toBeInTheDocument();
  });

  it('resets form after successful submission', async () => {
    mockCreateTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddTaskForm autoFocus />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.type(input, 'Test task');
    
    const textarea = screen.getByPlaceholderText('Description (optional)...');
    await user.type(textarea, 'Test description');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Description (optional)...')).not.toBeInTheDocument();
    });
    
    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('handles createTask errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateTask.mockRejectedValue(new Error('Network error'));
    
    const user = userEvent.setup();
    render(<AddTaskForm />);
    
    const input = screen.getByPlaceholderText('Add a new task...');
    await user.click(input);
    await user.type(input, 'Test task');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error creating task:', expect.any(Error));
    });
    
    expect(screen.getByText('Add Task')).toBeInTheDocument(); // Loading state should end
    
    consoleError.mockRestore();
  });
});
