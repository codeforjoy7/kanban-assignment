export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  history?: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: string;
}

export interface TaskStore {
  boardData: BoardData | null;
  isLoading: boolean;
  error: string | null;
  filter: string;
  
  // Actions
  fetchBoard: () => Promise<void>;
  createTask: (title: string, description?: string) => Promise<void>;
  updateTask: (id: string, title: string, description?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (
    taskId: string, 
    sourceColumnId: string, 
    destColumnId: string, 
    sourceIndex: number, 
    destIndex: number
  ) => Promise<void>;
  setFilter: (filter: string) => void;
  clearError: () => void;
}