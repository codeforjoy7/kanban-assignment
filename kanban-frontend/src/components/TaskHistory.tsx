import React, { useState } from 'react';
import useTaskStore from '../store';

const TaskHistory: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { boardData } = useTaskStore();

  const history = boardData?.history || [];
  if (history.length === 0) { return null };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">{history.length} recent actions</p>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{entry.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHistory;