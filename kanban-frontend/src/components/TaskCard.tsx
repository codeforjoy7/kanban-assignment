import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../types';
import useTaskStore from '../store';

interface TaskCardProps {
  task: Task;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editTitle.trim()) {
      await updateTask(task.id, editTitle.trim(), editDescription.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`} onClick={() => !isEditing && setIsEditing(true)}>
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-2 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={handleCancel} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Save</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">{task.title}</h3>
                <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 text-lg leading-none ml-2 flex-shrink-0" title="Delete task">×</button>
              </div>
              {task.description && (
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">{task.description}</p>
              )}
              <div className="text-xs text-gray-400 mt-2">{new Date(task.createdAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;