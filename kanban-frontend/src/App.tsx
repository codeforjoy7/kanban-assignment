import React, { useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import useTaskStore from './store';
import Column from './components/Column';
import AddTaskForm from './components/AddTaskForm';
import SearchFilter from './components/SearchFilter';
import TaskHistory from './components/TaskHistory';
import './App.css';

const App: React.FC = () => {
  const { 
    boardData, 
    isLoading, 
    error, 
    filter,
    fetchBoard, 
    moveTask, 
    clearError 
  } = useTaskStore();

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  const getFilteredTasks = (taskIds: string[]) => {
    if (!boardData) return [];
    
    const tasks = taskIds
      .map(id => boardData.tasks[id])
      .filter(Boolean);

    if (!filter) return tasks;

    return tasks.filter(task => 
      task.title.toLowerCase().includes(filter.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filter.toLowerCase()))
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your Kanban board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                clearError();
                fetchBoard();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <p className="text-sm text-gray-500">
              Make sure the backend server is running on port 5000
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No board data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Personal Kanban Board</h1>
          <p className="text-gray-600">With Persistent State</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AddTaskForm autoFocus />
          </div>
          <div>
            <SearchFilter />
          </div>
          <div>
            <TaskHistory />
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {boardData.columnOrder.map(columnId => {
              const column = boardData.columns[columnId];
              const tasks = getFilteredTasks(column.taskIds);
              return (
                <div key={column.id} className="min-h-0">
                  <Column column={column} tasks={tasks} />
                </div>
              );
            })}
          </div>
        </DragDropContext>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Built with React, TypeScript, and Express for CRED</p>
        </div>
      </div>
    </div>
  );
};

export default App;