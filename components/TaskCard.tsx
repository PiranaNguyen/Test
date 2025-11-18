import React from 'react';
import { Task, Employee, TaskStatus, UserRole } from '../types';
import { PRIORITY_STYLES, DIFFICULTY_STYLES } from '../constants';
import { TrashIcon, CalendarIcon, ChatBubbleIcon, PaperClipIcon } from './icons';

interface TaskCardProps {
  task: Task;
  assignees: Employee[];
  currentUser: Employee;
  onOpenDetails: (task: Task) => void;
  onDelete: (taskId: string) => void;
  displaySettings: {
    showDescription: boolean;
    showNotes: boolean;
    showComments: boolean;
  };
}

const TaskCard: React.FC<TaskCardProps> = ({ task, assignees, currentUser, onOpenDetails, onDelete, displaySettings }) => {
  const priorityStyle = PRIORITY_STYLES[task.priority];
  const difficultyStyle = DIFFICULTY_STYLES[task.difficulty];

  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = deadlineDate < today && task.status !== TaskStatus.DONE;

  const deadlineDay = new Date(task.deadline);
  deadlineDay.setHours(0, 0, 0, 0);
  const isDueToday = deadlineDay.getTime() === today.getTime();

  const twentyFourHours = 24 * 60 * 60 * 1000;
  const isWithin24Hours = (deadlineDate.getTime() - now.getTime()) < twentyFourHours && (deadlineDate.getTime() > now.getTime());

  const isDueSoon = (isDueToday || isWithin24Hours) && !isOverdue && task.status !== TaskStatus.DONE;
  
  let cardBorderClass = 'border-gray-700 hover:border-indigo-500';
  let deadlineIndicator: React.ReactNode = null;
  
  if (isOverdue) {
    cardBorderClass = 'border-red-500/60 hover:border-red-400';
    deadlineIndicator = (
      <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold animate-pulse">
        Quá hạn
      </span>
    );
  } else if (isDueSoon) {
    cardBorderClass = 'border-yellow-500/60 hover:border-yellow-400';
    deadlineIndicator = (
      <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold">
        Sắp đến hạn
      </span>
    );
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div 
      draggable={true}
      onDragStart={(e) => handleDragStart(e, task.id)}
      onDragEnd={handleDragEnd}
      className={`bg-gray-800 p-4 rounded-lg shadow-md border ${cardBorderClass} transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl cursor-pointer flex flex-col gap-3`}
      onClick={() => onOpenDetails(task)}
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết công việc: ${task.title}${isOverdue ? '. Công việc đã quá hạn.' : ''}${isDueSoon ? '. Công việc sắp đến hạn.' : ''}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDetails(task)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-white text-md leading-tight pr-2">
          <span className="font-mono text-sm text-gray-500 mr-2">#{task.sequenceId}</span>
          {task.title}
        </h3>
        {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
              className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 p-1 -mt-1 -mr-1"
              aria-label={`Xóa công việc: ${task.title}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        )}
      </div>
      
      {displaySettings.showDescription && task.description && (
        <p className="text-gray-400 text-sm">{task.description}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
            {task.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs font-medium">{tag}</span>
            ))}
        </div>
      )}

      {displaySettings.showNotes && task.notes && (
        <div className="text-gray-400 text-sm bg-gray-900/50 p-2 rounded-md border border-gray-700/50">
          <p className="font-semibold text-gray-300 text-xs">Ghi chú:</p>
          <p className="italic truncate">{task.notes}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityStyle.base} ${priorityStyle.text}`}>
              {task.priority}
            </div>
             <div className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyStyle.base} ${difficultyStyle.text}`}>
              {task.difficulty}
            </div>
        </div>
        <div className={`flex items-center text-gray-400`}>
          <CalendarIcon className="w-4 h-4" />
          <span className="ml-1">{new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
          {deadlineIndicator}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-400">
            {displaySettings.showComments && (
                <div className="flex items-center gap-1 hover:text-white transition-colors">
                    <ChatBubbleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{task.comments.length}</span>
                </div>
            )}
            {task.attachments?.length > 0 && (
                 <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <PaperClipIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{task.attachments.length}</span>
                </div>
            )}
        </div>
        
        {assignees.length > 0 ? (
          <div className="flex items-center justify-end gap-2" title={assignees.map(e => e.name).join(', ')}>
            <div className="text-right">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{assignees[0]?.name}</p>
                {assignees.length > 1 && (
                    <p className="text-xs text-gray-400">{`và ${assignees.length - 1} người khác`}</p>
                )}
            </div>
            <div className="flex -space-x-2">
                {assignees.slice(0, 2).map(emp => (
                    <img key={emp.id} src={emp.avatarUrl} alt={emp.name} className="w-7 h-7 rounded-full border-2 border-gray-700" />
                ))}
                {assignees.length > 2 && (
                    <div className="w-7 h-7 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                        +{assignees.length - 2}
                    </div>
                )}
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm italic">Chưa gán</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;