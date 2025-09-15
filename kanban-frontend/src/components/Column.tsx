import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column as ColumnType, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
}

const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const getColumnStyle = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return 'border-t-blue-500 bg-blue-50/30';
      case 'inprogress':
        return 'border-t-yellow-500 bg-yellow-50/30';
      case 'done':
        return 'border-t-green-500 bg-green-50/30';
      default:
        return 'border-t-gray-500 bg-gray-50/30';
    }
  };

  const getTaskCount = () => {
    return tasks.length;
  };

  return (
    <div className={`flex flex-col bg-gray-50 rounded-lg border-t-4 ${getColumnStyle(column.id)} min-h-0`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">{column.title}</h2>
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">{getTaskCount()}</span>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100/50 ring-2 ring-blue-300 ring-inset' : ''} min-h-[200px] overflow-y-auto`}>
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                {column.id === 'todo' ? 'Add your first task!' : `Drop tasks here or drag from other columns`}
              </div>
            ) : (tasks.map((task, index) => (<TaskCard key={task.id} task={task} index={index} />)))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;