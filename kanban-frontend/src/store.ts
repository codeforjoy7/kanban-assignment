import { create } from 'zustand';
import { TaskStore, BoardData } from './types';

const API_BASE = process.env.REACT_APP_API_URL;

const useTaskStore = create<TaskStore>((set, get) => ({
  boardData: null,
  isLoading: false,
  error: null,
  filter: '',

  fetchBoard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/board`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BoardData = await response.json();
      set({ boardData: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching board:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch board data',
        isLoading: false 
      });
    }
  },

  createTask: async (title: string, description?: string) => {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // We refresh the data in the board
      await get().fetchBoard();
    } catch (error) {
      // We set the error in the store
      console.error('Error creating task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
    }
  },

  updateTask: async (id: string, title: string, description?: string) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await get().fetchBoard();
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    }
  },

  deleteTask: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await get().fetchBoard();
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    }
  },

  moveTask: async (
    taskId: string, 
    sourceColumnId: string, 
    destColumnId: string, 
    sourceIndex: number, 
    destIndex: number
  ) => {
    // Optimistically update UI
    const currentData = get().boardData;
    if (currentData) {
      const newData = { ...currentData };
      const sourceColumn = { ...newData.columns[sourceColumnId] };
      const destColumn = sourceColumnId === destColumnId 
        ? sourceColumn 
        : { ...newData.columns[destColumnId] };

      // Remove from source
      sourceColumn.taskIds = [...sourceColumn.taskIds];
      sourceColumn.taskIds.splice(sourceIndex, 1);

      // Add to destination
      destColumn.taskIds = [...destColumn.taskIds];
      destColumn.taskIds.splice(destIndex, 0, taskId);

      // Update columns
      newData.columns = {
        ...newData.columns,
        [sourceColumnId]: sourceColumn,
        [destColumnId]: destColumn,
      };

      set({ boardData: newData });
    }

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceColumnId,
          destColumnId,
          sourceIndex,
          destIndex,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error moving task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to move task' });
      // Revert optimistic update on error
      await get().fetchBoard();
    }
  },

  setFilter: (filter: string) => {
    set({ filter });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useTaskStore;