
import React, { useState, useMemo } from 'react';
import { Project, Employee, KPI, OKR, Task, UserRole, TaskStatus, KeyResult, Timeframe } from '../types';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon, CheckBadgeIcon } from './icons';

interface PerformanceViewProps {
  project: Project;
  employees: Employee[];
  tasks: Task[];
  currentUser: Employee;
  currentTimeframe: Timeframe;
  // FIX: Updated the type to correctly reflect a React state setter function.
  onSetCurrentTimeframe: (value: React.SetStateAction<Timeframe>) => void;
  onEditKpi: (kpi: KPI) => void;
  onDeleteKpi: (kpiId: string) => void;
  onAddKpi: () => void;
  onEditOkr: (okr: OKR) => void;
  onDeleteOkr: (okrId: string) => void;
  onAddOkr: () => void;
  onUpdateKeyResultProgress: (okrId: string, krId: string, progress: number) => void;
}

// Helper functions for date manipulation
const getStartDate = (date: Date, period: 'week' | 'month' | 'quarter'): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  switch (period) {
    case 'week':
      const dayOfWeek = date.getDay(); // 0 is Sunday
      const firstDay = date.getDate() - dayOfWeek;
      return new Date(year, month, firstDay);
    case 'month':
      return new Date(year, month, 1);
    case 'quarter':
      const quarter = Math.floor(month / 3);
      return new Date(year, quarter * 3, 1);
    default:
      return date;
  }
};

const getTimeframeRange = (timeframe: Timeframe): { start: Date, end: Date } => {
    const startDate = new Date(timeframe.date + 'T00:00:00');
    let endDate: Date;
    switch(timeframe.period) {
        case 'week':
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
        case 'month':
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            break;
        case 'quarter':
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
            break;
    }
    endDate.setHours(23, 59, 59, 999);
    return { start: startDate, end: endDate };
};

const formatTimeframe = (timeframe: Timeframe): string => {
    const { start, end } = getTimeframeRange(timeframe);
    const startYear = start.getFullYear();
    switch(timeframe.period) {
        case 'week':
            return `Tuần ${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
        case 'month':
            return `Tháng ${start.getMonth() + 1}, ${startYear}`;
        case 'quarter':
            const quarter = Math.floor(start.getMonth() / 3) + 1;
            return `Quý ${quarter}, ${startYear}`;
    }
};

const PerformanceView: React.FC<PerformanceViewProps> = (props) => {
  const { project, employees, tasks, currentUser, currentTimeframe, onSetCurrentTimeframe, onAddKpi, onAddOkr, onUpdateKeyResultProgress } = props;
  const [activeTab, setActiveTab] = useState<'kpis' | 'okrs'>('kpis');

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const navigateTimeframe = (direction: 'prev' | 'next') => {
    const currentDate = new Date(currentTimeframe.date);
    let newDate;
    const increment = direction === 'next' ? 1 : -1;
    switch (currentTimeframe.period) {
      case 'week':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 7 * increment));
        break;
      case 'month':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() + increment));
        break;
      case 'quarter':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3 * increment));
        break;
    }
    onSetCurrentTimeframe(tf => ({ ...tf, date: newDate.toISOString().split('T')[0] }));
  };

  const changePeriod = (period: 'week' | 'month' | 'quarter') => {
    const currentlyViewedDate = new Date(currentTimeframe.date);
    onSetCurrentTimeframe({ period, date: getStartDate(currentlyViewedDate, period).toISOString().split('T')[0]});
  }

  const kpisForTimeframe = useMemo(() => (project.kpis || []).filter(kpi => 
    kpi.timeframe.period === currentTimeframe.period && 
    getStartDate(new Date(kpi.timeframe.date), kpi.timeframe.period).getTime() === new Date(currentTimeframe.date).getTime()
  ), [project.kpis, currentTimeframe]);

  const okrsForTimeframe = useMemo(() => (project.okrs || []).filter(okr =>
     okr.timeframe.period === currentTimeframe.period && 
    getStartDate(new Date(okr.timeframe.date), okr.timeframe.period).getTime() === new Date(currentTimeframe.date).getTime()
  ), [project.okrs, currentTimeframe]);

  const calculateKpiProgress = (kpi: KPI) => {
    const { start, end } = getTimeframeRange(kpi.timeframe);
    const completedTasks = tasks.filter(task => 
        task.projectId === kpi.projectId &&
        task.assigneeIds.includes(kpi.employeeId) &&
        task.status === TaskStatus.DONE &&
        new Date(task.deadline) >= start &&
        new Date(task.deadline) <= end
    ).length;
    return completedTasks;
  };
  
  const KpiCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
    const employee = employeesMap.get(kpi.employeeId);
    const progress = calculateKpiProgress(kpi);
    const percentage = kpi.target > 0 ? Math.min(Math.round((progress / kpi.target) * 100), 100) : 0;
    const isCompleted = progress >= kpi.target;

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img src={employee?.avatarUrl} alt={employee?.name} className="w-10 h-10 rounded-full"/>
                    <div>
                        <p className="font-bold text-white">{employee?.name}</p>
                        <p className="text-sm text-gray-400">{kpi.title}</p>
                    </div>
                </div>
                {currentUser.role === UserRole.ADMIN && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => props.onEditKpi(kpi)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700/50"><PencilIcon className="w-4 h-4"/></button>
                        <button onClick={() => props.onDeleteKpi(kpi.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700/50"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-bold text-xl ${isCompleted ? 'text-green-400' : 'text-white'}`}>{progress} / {kpi.target}</span>
                    <span className="text-sm font-semibold text-gray-300">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={`${isCompleted ? 'bg-green-500' : 'bg-indigo-500'} h-2.5 rounded-full transition-all duration-500`} style={{width: `${percentage}%`}}></div>
                </div>
            </div>
        </div>
    );
  }

  const OkrCard: React.FC<{ okr: OKR }> = ({ okr }) => {
    const employee = employeesMap.get(okr.employeeId);
    const overallProgress = okr.keyResults.length > 0 ? Math.round(okr.keyResults.reduce((acc, kr) => acc + kr.progress, 0) / okr.keyResults.length) : 0;
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img src={employee?.avatarUrl} alt={employee?.name} className="w-10 h-10 rounded-full"/>
                    <div>
                        <p className="font-bold text-white">{employee?.name}</p>
                        <p className="text-sm text-indigo-300 font-semibold">{okr.objective}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                   {currentUser.id === okr.employeeId && <button onClick={() => props.onEditOkr(okr)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700/50"><PencilIcon className="w-4 h-4"/></button>}
                   {(currentUser.id === okr.employeeId || currentUser.role === UserRole.ADMIN) && <button onClick={() => props.onDeleteOkr(okr.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700/50"><TrashIcon className="w-4 h-4"/></button>}
                </div>
            </div>
            
            <div className="space-y-3">
                {okr.keyResults.map(kr => (
                    <div key={kr.id}>
                        <div className="flex justify-between items-center text-sm mb-1.5">
                            <div className="flex items-center gap-2">
                                <CheckBadgeIcon className={`w-5 h-5 ${kr.progress === 100 ? 'text-green-400' : 'text-gray-500'}`} />
                                <span className="text-gray-300">{kr.title}</span>
                            </div>
                            <span className="font-semibold text-white">{kr.progress}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            value={kr.progress}
                            onChange={(e) => onUpdateKeyResultProgress(okr.id, kr.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            disabled={currentUser.id !== okr.employeeId}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
  }

  const tabButtonClass = (tabName: string) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`;

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Theo dõi Hiệu suất</h3>
          <p className="text-gray-400 text-sm">Quản lý KPIs và OKRs cho dự án "{project.name}"</p>
        </div>
         <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button onClick={() => changePeriod('week')} className={currentTimeframe.period === 'week' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Tuần</button>
            <button onClick={() => changePeriod('month')} className={currentTimeframe.period === 'month' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Tháng</button>
            <button onClick={() => changePeriod('quarter')} className={currentTimeframe.period === 'quarter' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Quý</button>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
          <button onClick={() => navigateTimeframe('prev')} className="p-2 hover:bg-gray-700 rounded"><ChevronLeftIcon /></button>
          <span className="font-semibold text-white text-center w-40">{formatTimeframe(currentTimeframe)}</span>
          <button onClick={() => navigateTimeframe('next')} className="p-2 hover:bg-gray-700 rounded"><ChevronRightIcon /></button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <div className="flex items-center gap-2">
            <button className={tabButtonClass('kpis')} onClick={() => setActiveTab('kpis')}>KPIs</button>
            <button className={tabButtonClass('okrs')} onClick={() => setActiveTab('okrs')}>OKRs</button>
          </div>
          {activeTab === 'kpis' && currentUser.role === UserRole.ADMIN && (
              <button onClick={onAddKpi} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition text-sm">
                  <PlusIcon className="w-5 h-5"/> <span>Thêm KPI</span>
              </button>
          )}
          {activeTab === 'okrs' && (
              <button onClick={onAddOkr} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition text-sm">
                  <PlusIcon className="w-5 h-5"/> <span>Đặt OKR của tôi</span>
              </button>
          )}
      </div>

      {/* Content */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {kpisForTimeframe.length > 0 ? kpisForTimeframe.map(kpi => <KpiCard key={kpi.id} kpi={kpi} />)
            : <p className="text-gray-500 italic col-span-full text-center py-8">Không có KPI nào được thiết lập cho kỳ này.</p>}
        </div>
      )}

      {activeTab === 'okrs' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {okrsForTimeframe.length > 0 ? okrsForTimeframe.map(okr => <OkrCard key={okr.id} okr={okr} />)
             : <p className="text-gray-500 italic col-span-full text-center py-8">Không có OKR nào được thiết lập cho kỳ này.</p>}
        </div>
      )}
    </div>
  );
};

export default PerformanceView;
