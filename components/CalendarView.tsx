import React, { useMemo } from 'react';
import { Task } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { PRIORITY_STYLES } from '../constants';

interface CalendarViewProps {
  tasks: Task[];
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onTaskClick: (task: Task) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, currentDate, onDateChange, onTaskClick }) => {
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const dateKey = task.deadline; // YYYY-MM-DD
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  const calendarGrid: CalendarDay[] = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday...

    const grid: CalendarDay[] = [];

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Days from next month
    const gridEndOffset = 42 - grid.length; // 6 weeks * 7 days
    for (let i = 1; i <= gridEndOffset; i++) {
        grid.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false
        })
    }

    return grid;
  }, [currentDate]);

  const handlePrevMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
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

      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-400 text-sm mb-2">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, index) => {
          const isToday = day.date.setHours(0,0,0,0) === today.getTime();
          const dayTasks = tasksByDate.get(formatDateKey(day.date)) || [];
          
          return (
            <div
              key={index}
              className={`h-32 rounded-md p-1.5 flex flex-col relative overflow-hidden
                ${day.isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900/50'}
                ${isToday ? 'border-2 border-indigo-500' : ''}
              `}
            >
              <span className={`font-medium text-xs ${day.isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                {day.date.getDate()}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto">
                 {dayTasks.map(task => {
                    const priorityStyle = PRIORITY_STYLES[task.priority];
                    return (
                        <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className="p-1.5 rounded-md text-xs cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: priorityStyle.base.replace('bg-','').split('/')[0] + '-500' }}
                         >
                            <p className={`font-semibold truncate text-white`}>{task.title}</p>
                        </div>
                    )
                 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
