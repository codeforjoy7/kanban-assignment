import React from 'react';
import useTaskStore from '../store';

const SearchFilter: React.FC = () => {
  const { filter, setFilter, boardData } = useTaskStore();
  
  const totalTasks = boardData ? Object.keys(boardData.tasks).length : 0;
  const filteredCount = boardData && filter ? Object.values(boardData.tasks).filter(task => task.title.toLowerCase().includes(filter.toLowerCase()) || (task.description && task.description.toLowerCase().includes(filter.toLowerCase()))).length : totalTasks;
  
  const handleClear = () => {
    setFilter('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search tasks by title or description..."
          />
          {filter && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {filter && (<div className="text-sm text-gray-500 whitespace-nowrap">{filteredCount} of {totalTasks} tasks</div>)}
      </div>
      
      {filter && filteredCount === 0 && (<div className="mt-3 text-sm text-gray-500 text-center py-2">No tasks found for "{filter}"</div>)}
    </div>
  );
};

export default SearchFilter;