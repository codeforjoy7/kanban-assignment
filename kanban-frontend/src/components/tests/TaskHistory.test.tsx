import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskHistory from '../TaskHistory';
import useTaskStore from '../../store';
import { BoardData, HistoryEntry } from '../../types';

// Mock the store
jest.mock('../../store');
const mockUseTaskStore = useTaskStore as jest.MockedFunction<typeof useTaskStore>;

const mockHistoryEntries: HistoryEntry[] = [
  {
    id: '1',
    action: 'Created task "Buy groceries"',
    timestamp: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    action: 'Moved task "Complete project" from To Do to In Progress',
    timestamp: '2023-01-01T10:05:00Z',
  },
  {
    id: '3',
    action: 'Updated task "Exercise"',
    timestamp: '2023-01-01T10:10:00Z',
  },
];

const mockBoardData: BoardData = {
  tasks: {},
  columns: {},
  columnOrder: [],
  history: mockHistoryEntries,
};

const mockStore = {
  boardData: mockBoardData,
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  moveTask: jest.fn(),
  fetchBoard: jest.fn(),
  setFilter: jest.fn(),
  clearError: jest.fn(),
  isLoading: false,
  error: null,
  filter: '',
};

describe('TaskHistory', () => {
  beforeEach(() => {
    mockUseTaskStore.mockReturnValue(mockStore);
    
    // Mock Date.now() to control time-based tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T10:15:00Z')); // 15 minutes after last action
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders collapsed by default', () => {
    render(<TaskHistory />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('3 recent actions')).toBeInTheDocument();
    expect(screen.queryByText('Created task "Buy groceries"')).not.toBeInTheDocument();
  });

  it('shows chevron pointing down when collapsed', () => {
    render(<TaskHistory />);
    
    const chevron = screen.getByText('Recent Activity').closest('button')?.querySelector('svg');
    expect(chevron).toBeInTheDocument();
    expect(chevron).not.toHaveClass('rotate-180');
  });

  it('expands when header is clicked', async () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    expect(screen.getByText('Created task "Buy groceries"')).toBeInTheDocument();
    expect(screen.getByText('Moved task "Complete project" from To Do to In Progress')).toBeInTheDocument();
    expect(screen.getByText('Updated task "Exercise"')).toBeInTheDocument();
  });

  it('shows chevron pointing up when expanded', () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    const chevron = headerButton?.querySelector('svg');
    expect(chevron).toHaveClass('rotate-180');
  });

  it('collapses when header is clicked again', () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    
    // Expand
    fireEvent.click(headerButton!);
    expect(screen.getByText('Created task "Buy groceries"')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(headerButton!);
    expect(screen.queryByText('Created task "Buy groceries"')).not.toBeInTheDocument();
  });

  it('displays all history entries when expanded', () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    mockHistoryEntries.forEach((entry) => {
      expect(screen.getByText(entry.action)).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly - minutes ago', () => {
    // Set current time to 5 minutes after the last action
    jest.setSystemTime(new Date('2023-01-01T10:15:00Z')); // 5 minutes after 10:10:00
    
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('formats timestamps correctly - hours ago', () => {
    jest.setTimeout(10000);
    // Set current time to 2 hours after the last action
    jest.setSystemTime(new Date('2023-01-01T12:15:00Z'));
    
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    expect(screen.getAllByText('2h ago')).toHaveLength(3);
  });

  it('formats timestamps correctly - days ago (shows date)', () => {
    jest.setTimeout(10000);
    // Set current time to next day
    jest.setSystemTime(new Date('2023-01-02T10:15:00Z'));
    
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    expect(screen.getAllByText('1/1/2023')).toHaveLength(3);
  });

  it('formats timestamps correctly - just now', () => {
    jest.setTimeout(10000);
    // Set current time to same minute as last action
    jest.setSystemTime(new Date('2023-01-01T10:10:30Z'));
    
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('does not render when history is empty', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        history: [],
      },
    });
    
    const { container } = render(<TaskHistory />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when boardData is null', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: null,
    });
    
    const { container } = render(<TaskHistory />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when history is undefined', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        history: undefined,
      },
    });
    
    const { container } = render(<TaskHistory />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows correct count with single history entry', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        history: [mockHistoryEntries[0]],
      },
    });
    
    render(<TaskHistory />);
    
    expect(screen.getByText('1 recent actions')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<TaskHistory />);
    
    const container = screen.getByText('Recent Activity').closest('.bg-white.rounded-lg.border.border-gray-200.shadow-sm');
    expect(container).toBeInTheDocument();
  });

  it('has proper header button styling', () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    expect(headerButton).toHaveClass(
      'w-full',
      'p-4',
      'text-left',
      'hover:bg-gray-50',
      'transition-colors',
      'flex',
      'items-center',
      'justify-between'
    );
  });

  it('displays history entries with proper structure', () => {
    jest.setTimeout(10000);
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    // Check for dot indicators
    const dotIndicators = screen.getAllByRole('generic').filter(el => 
      el.className.includes('w-2 h-2 bg-blue-400 rounded-full')
    );
    expect(dotIndicators).toHaveLength(mockHistoryEntries.length);
  });

  it('has scrollable history area when expanded', () => {
    jest.setTimeout(10000);
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    const historyContainer = screen.getByText('Created task "Buy groceries"').closest('.max-h-64.overflow-y-auto');
    expect(historyContainer).toBeInTheDocument();
  });

  it('orders history entries correctly', () => {
    jest.setTimeout(10000);
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    const historyItems = screen.getAllByText(/Created task|Moved task|Updated task/);
    
    // Should be in the order they appear in the mock data
    expect(historyItems[0]).toHaveTextContent('Created task "Buy groceries"');
    expect(historyItems[1]).toHaveTextContent('Moved task "Complete project" from To Do to In Progress');
    expect(historyItems[2]).toHaveTextContent('Updated task "Exercise"');
  });

  it('handles invalid timestamps gracefully', () => {
    jest.setTimeout(10000);
    const historyWithInvalidDate: HistoryEntry[] = [
      {
        id: '1',
        action: 'Invalid timestamp test',
        timestamp: 'invalid-date',
      },
    ];
    
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        history: historyWithInvalidDate,
      },
    });
    
    render(<TaskHistory />);
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    // Should still render the entry, even with invalid timestamp
    expect(screen.getByText('Invalid timestamp test')).toBeInTheDocument();
  });

  it('maintains accessibility with proper heading structure', () => {
    render(<TaskHistory />);
    
    const heading = screen.getByText('Recent Activity');
    expect(heading.tagName).toBe('H3');
    expect(heading).toHaveClass('font-medium', 'text-gray-900');
  });

  it('has proper button accessibility', () => {
    render(<TaskHistory />);
    
    const headerButton = screen.getByRole('button');
    expect(headerButton).toBeInTheDocument();
    expect(headerButton).toHaveTextContent('Recent Activity');
  });

  it('handles large number of history entries', () => {
    jest.setTimeout(10000);
    const manyEntries: HistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i}`,
      action: `Action ${i}`,
      timestamp: new Date(2023, 0, 1, 10, i).toISOString(),
    }));
    
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      boardData: {
        ...mockBoardData,
        history: manyEntries,
      },
    });
    
    render(<TaskHistory />);
    
    expect(screen.getByText('50 recent actions')).toBeInTheDocument();
    
    const headerButton = screen.getByText('Recent Activity').closest('button');
    fireEvent.click(headerButton!);
    
    // Should render all entries (the scrollable container handles overflow)
    expect(screen.getByText('Action 0')).toBeInTheDocument();
    expect(screen.getByText('Action 49')).toBeInTheDocument();
  });
});
