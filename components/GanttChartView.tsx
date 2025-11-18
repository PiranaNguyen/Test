import React, { useMemo } from 'react';
import { Employee, Task } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { PRIORITY_STYLES } from '../constants';

interface GanttChartViewProps {
  tasks: Task[];
  employeesMap: Map<string, Employee>;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onTaskClick: (task: Task) => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ tasks, employeesMap, currentDate, onDateChange, onTaskClick }) => {
  const { daysInMonth, month, year, firstDayOfMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    return { daysInMonth, month, year, firstDayOfMonth };
  }, [currentDate]);

  const handlePrevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate + 'T00:00:00');
    const taskEnd = new Date(task.deadline + 'T00:00:00');
    
    // Clamp task dates to the current month view
    const monthStart = firstDayOfMonth;
    const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

    if (taskEnd < monthStart || taskStart > monthEnd) {
      return null; // Task is not in the current month
    }
    
    const start = taskStart < monthStart ? monthStart : taskStart;
    const end = taskEnd > monthEnd ? monthEnd : taskEnd;

    const startDay = start.getDate();
    
    // Calculate duration in days, inclusive
    const duration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

    return {
      startDay: startDay,
      duration: duration,
    };
  };

  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [tasks]);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 overflow-x-auto">
      <div className="flex justify-between items-center mb-4 min-w-[1000px]">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-700 transition" aria-label="Tháng trước">
          <ChevronLeftIcon className="w-6 h-6 text-gray-300" />
        </button>
        <h3 className="text-xl font-bold text-white capitalize">
          {currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-700 transition" aria-label="Tháng sau">
          <ChevronRightIcon className="w-6 h-6 text-gray-300" />
        </button>
      </div>

      <div className="grid text-white min-w-[1200px]" style={{ gridTemplateColumns: `250px 1fr`}}>
        {/* Header */}
        <div className="sticky left-0 bg-gray-800 z-20 border-r border-b border-gray-700 p-2 text-sm font-semibold text-white">Công việc</div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(40px, 1fr))`}}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <div key={day} className={`text-center p-2 border-b border-r border-gray-700 text-xs font-medium ${isCurrentMonth && day === todayDate ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400'}`}>
                {day}
              </div>
            ))}
        </div>

        {/* Rows */}
        {sortedTasks.map((task, index) => {
            const position = getTaskPosition(task);
            if (!position) return null;

            const priorityStyle = PRIORITY_STYLES[task.priority];
            const assignees = task.assigneeIds.map(id => employeesMap.get(id)).filter(Boolean);

            return (
                <React.Fragment key={task.id}>
                    <div className={`sticky left-0 p-2 flex items-center text-sm truncate border-r border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition z-10 ${index % 2 ? 'bg-gray-800' : 'bg-gray-800/50'}`} onClick={() => onTaskClick(task)}>
                        {task.title}
                    </div>
                    <div className={`relative border-b border-gray-700 ${index % 2 ? 'bg-gray-900/40' : 'bg-gray-900/20'}`}>
                        { isCurrentMonth && <div className="absolute top-0 bottom-0 border-r-2 border-indigo-500/50" style={{ left: `calc(${ (todayDate - 1) / daysInMonth * 100}% + (${40 * (todayDate - 1)}px / ${daysInMonth}))`}} /> }
                        <div
                            onClick={() => onTaskClick(task)}
                            className={`absolute h-[70%] top-[15%] rounded-md flex items-center px-2 cursor-pointer transition-all duration-200 hover:brightness-125 shadow-lg ${priorityStyle.base}`}
                            style={{
                                left: `calc(${(position.startDay - 1) / daysInMonth * 100}% + 4px)`,
                                width: `calc(${position.duration / daysInMonth * 100}% - 8px)`,
                            }}
                             title={`${task.title} (${task.startDate} - ${task.deadline})`}
                        >
                            <p className={`text-xs font-semibold truncate ${priorityStyle.text}`}>{task.title}</p>
                            <div className="flex -space-x-2 ml-auto">
                                {assignees.slice(0, 2).map(emp => (
                                <img key={emp.id} src={emp.avatarUrl} alt={emp.name} title={emp.name} className="w-5 h-5 rounded-full border border-gray-900/50" />
                                ))}
                                {assignees.length > 2 && (
                                    <div className="w-5 h-5 rounded-full border border-gray-900/50 bg-gray-600 flex items-center justify-center text-[10px] font-bold text-white">
                                        +{assignees.length - 2}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            )
        })}
      </div>
      {tasks.length === 0 && (
        <div className="text-center py-10 text-gray-500 italic">
          Không có công việc nào để hiển thị trong tháng này.
        </div>
      )}
    </div>
  );
};

export default GanttChartView;
