
import React, { useState, useMemo } from 'react';
import { Project, Employee, KPI, OKR, Task, UserRole, TaskStatus, KeyResult, Timeframe } from '../types';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon, CheckBadgeIcon, TrendingUpIcon, ClockIcon, SparklesIcon } from './icons';

interface PerformanceViewProps {
  project: Project;
  employees: Employee[];
  tasks: Task[];
  currentUser: Employee;
  currentTimeframe: Timeframe;
  onSetCurrentTimeframe: (value: React.SetStateAction<Timeframe>) => void;
  onEditKpi: (kpi: KPI) => void;
  onDeleteKpi: (kpiId: string) => void;
  onAddKpi: () => void;
  onEditOkr: (okr: OKR) => void;
  onDeleteOkr: (okrId: string) => void;
  onAddOkr: () => void;
  onUpdateKeyResultProgress: (okrId: string, krId: string, progress: number) => void;
  onGenerateSampleKpis: () => void;
  onGenerateSampleOkrs: () => void;
}

// Helper to safely parse YYYY-MM-DD into a Local Date object by appending T00:00:00
// This avoids UTC parsing issues with simple date strings
const parseDateLocal = (dateStr: string): Date => {
    // If it's already ISO formatted with T, use it, otherwise append T00:00:00
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
};

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
    const startDate = parseDateLocal(timeframe.date);
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
  const { project, employees, tasks, currentUser, currentTimeframe, onSetCurrentTimeframe, onAddKpi, onAddOkr, onUpdateKeyResultProgress, onGenerateSampleKpis, onGenerateSampleOkrs } = props;
  const [activeTab, setActiveTab] = useState<'kpis' | 'okrs'>('kpis');

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const navigateTimeframe = (direction: 'prev' | 'next') => {
    const currentDate = parseDateLocal(currentTimeframe.date);
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
    const currentlyViewedDate = parseDateLocal(currentTimeframe.date);
    onSetCurrentTimeframe({ period, date: getStartDate(currentlyViewedDate, period).toISOString().split('T')[0]});
  }

  const kpisForTimeframe = useMemo(() => {
    const currentStart = getStartDate(parseDateLocal(currentTimeframe.date), currentTimeframe.period);
    const currentStartStr = currentStart.toISOString().split('T')[0];

    return (project.kpis || []).filter(kpi => {
        if (kpi.timeframe.period !== currentTimeframe.period) return false;
        
        const kpiStart = getStartDate(parseDateLocal(kpi.timeframe.date), kpi.timeframe.period);
        return kpiStart.toISOString().split('T')[0] === currentStartStr;
    });
  }, [project.kpis, currentTimeframe]);

  const okrsForTimeframe = useMemo(() => {
    const currentStart = getStartDate(parseDateLocal(currentTimeframe.date), currentTimeframe.period);
    const currentStartStr = currentStart.toISOString().split('T')[0];

    return (project.okrs || []).filter(okr => {
        if (okr.timeframe.period !== currentTimeframe.period) return false;
        
        const okrStart = getStartDate(parseDateLocal(okr.timeframe.date), okr.timeframe.period);
        return okrStart.toISOString().split('T')[0] === currentStartStr;
    });
  }, [project.okrs, currentTimeframe]);

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
    const remaining = Math.max(0, kpi.target - progress);
    
    let statusColor = 'text-blue-400';
    let progressBarColor = 'bg-blue-500';
    let bgColor = 'bg-blue-500/10';
    let statusLabel = 'Đang thực hiện';
    let borderColor = 'border-gray-700 hover:border-blue-500/50';

    if (isCompleted) {
        statusColor = 'text-green-400';
        progressBarColor = 'bg-green-500';
        bgColor = 'bg-green-500/10';
        statusLabel = 'Hoàn thành';
        borderColor = 'border-green-900/50 hover:border-green-500/50';
    } else if (percentage === 0) {
        statusColor = 'text-gray-400';
        progressBarColor = 'bg-gray-500';
        bgColor = 'bg-gray-500/10';
        statusLabel = 'Chưa bắt đầu';
    } else if (percentage < 40) {
        statusColor = 'text-yellow-400';
        progressBarColor = 'bg-yellow-500';
        bgColor = 'bg-yellow-500/10';
        statusLabel = 'Cần cố gắng';
        borderColor = 'border-yellow-900/50 hover:border-yellow-500/50';
    }

    return (
        <div className={`bg-gray-800 rounded-xl border ${borderColor} transition-all duration-300 shadow-lg hover:shadow-xl group flex flex-col h-full relative overflow-hidden`}>
             {/* Decorative background */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${isCompleted ? 'green' : 'blue'}-500/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none`}></div>

            <div className="p-5 flex-grow relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                         <div className="relative">
                            <img src={employee?.avatarUrl} alt={employee?.name} className="w-12 h-12 rounded-full border-2 border-gray-700 shadow-sm object-cover" />
                             <span className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-gray-800 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}></span>
                         </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{employee?.role}</p>
                            <h4 className="font-bold text-white text-lg line-clamp-1" title={employee?.name}>{employee?.name}</h4>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]" title={employee?.email}>{employee?.email}</p>
                        </div>
                    </div>
                     {currentUser.role === UserRole.ADMIN && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => props.onEditKpi(kpi)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-md hover:bg-gray-700 transition"><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={() => props.onDeleteKpi(kpi.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
                
                <div className="mb-4">
                    <p className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <TrendingUpIcon className="w-4 h-4 text-indigo-400"/>
                        {kpi.title}
                    </p>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                         <div>
                            <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${bgColor} ${statusColor}`}>
                                {statusLabel}
                            </span>
                         </div>
                         <div className="text-right">
                            <div>
                                <span className="text-2xl font-bold text-white">{progress}</span>
                                <span className="text-sm text-gray-500 font-medium mx-1">/</span>
                                <span className="text-sm text-gray-400 font-medium">{kpi.target}</span>
                            </div>
                            {!isCompleted && (
                                <p className="text-xs text-gray-500 mt-0.5">Còn {remaining} mục tiêu</p>
                            )}
                         </div>
                    </div>
                    
                    <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full ${progressBarColor} transition-all duration-700 ease-out`} style={{width: `${percentage}%`}}></div>
                    </div>
                </div>
            </div>
            
            {/* Footer Info */}
            <div className="px-5 py-3 bg-gray-900/30 border-t border-gray-700/50 rounded-b-xl flex justify-between items-center text-xs text-gray-500 font-medium">
                 <span>{percentage}% hoàn thành</span>
                 <div className="flex items-center gap-1.5">
                     <ClockIcon className="w-3.5 h-3.5"/>
                     <span>{formatTimeframe(kpi.timeframe)}</span>
                 </div>
            </div>
        </div>
    );
  }

  const OkrCard: React.FC<{ okr: OKR }> = ({ okr }) => {
    const employee = employeesMap.get(okr.employeeId);
    const overallProgress = okr.keyResults.length > 0 ? Math.round(okr.keyResults.reduce((acc, kr) => acc + kr.progress, 0) / okr.keyResults.length) : 0;
    
    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-md transition-all hover:shadow-lg hover:border-indigo-500/30">
             {/* Objective Header */}
             <div className="p-4 bg-gray-800 border-b border-gray-700/50 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                 <div className="flex justify-between items-start gap-4 pl-2">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                             <img src={employee?.avatarUrl} alt={employee?.name} className="w-9 h-9 rounded-full border border-gray-600 object-cover" title={employee?.name}/>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-500/20">Objective</span>
                                <span className="text-sm text-gray-400">{employee?.name}</span>
                            </div>
                            <h4 className="text-lg font-bold text-white leading-tight">{okr.objective}</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                         <div className={`px-2 py-1 rounded text-xs font-bold mr-2 ${overallProgress >= 100 ? 'bg-green-900/50 text-green-400 border border-green-500/30' : 'bg-gray-700 text-white border border-gray-600'}`}>
                             {overallProgress}%
                         </div>
                       {currentUser.id === okr.employeeId && <button onClick={() => props.onEditOkr(okr)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700/50"><PencilIcon className="w-4 h-4"/></button>}
                       {(currentUser.id === okr.employeeId || currentUser.role === UserRole.ADMIN) && <button onClick={() => props.onDeleteOkr(okr.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700/50"><TrashIcon className="w-4 h-4"/></button>}
                    </div>
                </div>
                 {/* Overall Progress Bar */}
                <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${overallProgress}%`}}></div>
                </div>
            </div>
            
            {/* Key Results List */}
            <div className="p-4 bg-gray-800/50 space-y-4">
                {okr.keyResults.map((kr, index) => (
                    <div key={kr.id} className="relative pl-4 border-l-2 border-gray-700 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-mono text-xs pt-0.5">KR {index + 1}</span>
                                <span className="text-gray-300 text-sm font-medium line-clamp-2">{kr.title}</span>
                            </div>
                            <span className={`text-xs font-bold min-w-[3ch] text-right ${kr.progress === 100 ? 'text-green-400' : 'text-gray-400'}`}>{kr.progress}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={kr.progress}
                                onChange={(e) => onUpdateKeyResultProgress(okr.id, kr.id, parseInt(e.target.value))}
                                className="flex-grow h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                disabled={currentUser.id !== okr.employeeId}
                                title={`Cập nhật tiến độ: ${kr.progress}%`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  const tabButtonClass = (tabName: string) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`;

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Theo dõi Hiệu suất</h3>
          <p className="text-gray-400 text-sm">Quản lý KPIs và OKRs cho dự án <span className="text-indigo-300 font-semibold">"{project.name}"</span></p>
        </div>
         <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button onClick={() => changePeriod('week')} className={currentTimeframe.period === 'week' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Tuần</button>
            <button onClick={() => changePeriod('month')} className={currentTimeframe.period === 'month' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Tháng</button>
            <button onClick={() => changePeriod('quarter')} className={currentTimeframe.period === 'quarter' ? 'bg-indigo-600 text-white px-3 py-1 rounded' : 'text-gray-300 px-3 py-1 hover:bg-gray-700 rounded'}>Quý</button>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
          <button onClick={() => navigateTimeframe('prev')} className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white"><ChevronLeftIcon /></button>
          <span className="font-semibold text-white text-center w-40 text-sm">{formatTimeframe(currentTimeframe)}</span>
          <button onClick={() => navigateTimeframe('next')} className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white"><ChevronRightIcon /></button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
            <button className={tabButtonClass('kpis')} onClick={() => setActiveTab('kpis')}>KPIs</button>
            <button className={tabButtonClass('okrs')} onClick={() => setActiveTab('okrs')}>OKRs</button>
          </div>
          {activeTab === 'kpis' && currentUser.role === UserRole.ADMIN && (
              <div className="flex items-center gap-2">
                  <button onClick={onGenerateSampleKpis} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-indigo-300 rounded-md hover:bg-gray-600 transition text-sm font-semibold border border-gray-600 hover:border-indigo-400">
                      <SparklesIcon className="w-5 h-5"/> <span className="hidden sm:inline">Tạo mẫu</span>
                  </button>
                  <button onClick={onAddKpi} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition text-sm font-semibold shadow-lg shadow-indigo-500/20">
                      <PlusIcon className="w-5 h-5"/> <span>Thêm KPI</span>
                  </button>
              </div>
          )}
          {activeTab === 'okrs' && (
              <div className="flex items-center gap-2">
                   <button onClick={onGenerateSampleOkrs} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-indigo-300 rounded-md hover:bg-gray-600 transition text-sm font-semibold border border-gray-600 hover:border-indigo-400">
                      <SparklesIcon className="w-5 h-5"/> <span className="hidden sm:inline">Tạo mẫu</span>
                  </button>
                  <button onClick={onAddOkr} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition text-sm font-semibold shadow-lg shadow-indigo-500/20">
                      <PlusIcon className="w-5 h-5"/> <span>Đặt OKR Mới</span>
                  </button>
              </div>
          )}
      </div>

      {/* Content */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
            {kpisForTimeframe.length > 0 ? kpisForTimeframe.map(kpi => <KpiCard key={kpi.id} kpi={kpi} />)
            : <div className="text-gray-500 italic col-span-full text-center py-12 bg-gray-800/30 rounded-lg border border-dashed border-gray-700 flex flex-col items-center justify-center">
                <p className="mb-2">Không có KPI nào được thiết lập cho kỳ này.</p>
                {currentUser.role === UserRole.ADMIN && (
                    <div className="mt-2 flex gap-3">
                        <button onClick={onGenerateSampleKpis} className="text-indigo-400 hover:underline text-sm font-semibold flex items-center gap-1">
                            <SparklesIcon className="w-4 h-4"/> Tạo mẫu nhanh
                        </button>
                        <span className="text-gray-600">|</span>
                        <button onClick={onAddKpi} className="text-indigo-400 hover:underline text-sm font-semibold">
                             Thêm thủ công
                        </button>
                    </div>
                )}
              </div>}
        </div>
      )}

      {activeTab === 'okrs' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {okrsForTimeframe.length > 0 ? okrsForTimeframe.map(okr => <OkrCard key={okr.id} okr={okr} />)
             : <div className="text-gray-500 italic col-span-full text-center py-12 bg-gray-800/30 rounded-lg border border-dashed border-gray-700 flex flex-col items-center justify-center">
                <p className="mb-2">Không có OKR nào được thiết lập cho kỳ này.</p>
                 <div className="mt-2 flex gap-3">
                    <button onClick={onGenerateSampleOkrs} className="text-indigo-400 hover:underline text-sm font-semibold flex items-center gap-1">
                        <SparklesIcon className="w-4 h-4"/> Tạo mẫu nhanh
                    </button>
                    <span className="text-gray-600">|</span>
                    <button onClick={onAddOkr} className="text-indigo-400 hover:underline text-sm font-semibold">
                            Thêm thủ công
                    </button>
                </div>
             </div>}
        </div>
      )}
    </div>
  );
};

export default PerformanceView;
