import React, { useState, useMemo } from 'react';
import { Task, Employee, Project, TaskDifficulty, TaskStatus, KPI, OKR, Timeframe } from '../types';
import { DIFFICULTY_STYLES, STATUS_STYLES } from '../constants';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, TrendingUpIcon, CheckBadgeIcon } from './icons';

interface DashboardViewProps {
  tasks: Task[];
  employees: Employee[];
  project: Project;
}

// === Timeframe Helper Functions (from PerformanceView) ===
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

const calculateKpiProgress = (kpi: KPI, allTasks: Task[]): number => {
    const { start, end } = getTimeframeRange(kpi.timeframe);
    const completedTasks = allTasks.filter(task => 
        task.projectId === kpi.projectId &&
        task.assigneeIds.includes(kpi.employeeId) &&
        task.status === TaskStatus.DONE &&
        new Date(task.deadline) >= start &&
        new Date(task.deadline) <= end
    ).length;
    return completedTasks;
};


// === Helper Components for the new Dashboard Design ===

// KPI Card Component
const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-700">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// Donut Chart Component using conic-gradient
const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center min-h-[250px]">
        <h4 className="font-bold text-white mb-4">{title}</h4>
        <p className="text-gray-500 italic">Không có dữ liệu</p>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const gradientParts = data.map(item => {
    const percentage = (item.value / total) * 100;
    const part = `${item.color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`;
    cumulativePercentage += percentage;
    return part;
  });

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h4 className="font-bold text-white text-center mb-4">{title}</h4>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div 
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
        >
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{total}</span>
            </div>
        </div>
        <div className="flex-1 space-y-2 text-sm">
            {data.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-300">{item.label}</span>
                    </div>
                    <span className="font-semibold text-white">{item.value} ({~~((item.value / total) * 100)}%)</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Stacked Progress Bar for Employee Table
const StackedProgressBar: React.FC<{ data: { value: number; color: string; label: string }[], total: number }> = ({ data, total }) => {
    if (total === 0) return <div className="h-5 bg-gray-700 rounded-full"></div>;
    return (
        <div className="w-full flex h-5 bg-gray-700 rounded-full overflow-hidden" title={data.map(d => `${d.label}: ${d.value}`).join('\n')}>
            {data.map(item => (
                <div 
                    key={item.label}
                    style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
                    className="transition-all duration-300"
                />
            ))}
        </div>
    );
};

// --- Main Dashboard View Component ---
type PerformanceData = {
  employee: Employee;
  totalTasks: number;
  byDifficulty: { [key in TaskDifficulty]: number };
  byStatus: { [key in TaskStatus]: number };
  kpiCount: number;
  kpiCompleted: number;
  okrAverageProgress: number;
};

const getMonthDateRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, employees, project }) => {
  const [dateRange, setDateRange] = useState(getMonthDateRange);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange(prev => ({...prev, [e.target.name]: e.target.value }));
  };

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const filteredTasks = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return [];
    const start = new Date(dateRange.startDate + 'T00:00:00');
    const end = new Date(dateRange.endDate + 'T23:59:59');
    return tasks.filter(task => {
        const taskStart = new Date(task.startDate + 'T00:00:00');
        const taskEnd = new Date(task.deadline + 'T00:00:00');
        return taskStart <= end && taskEnd >= start;
    });
  }, [tasks, dateRange]);
  
  const { kpisInView, okrsInView } = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return { kpisInView: [], okrsInView: [] };
    const dashboardStart = new Date(dateRange.startDate + 'T00:00:00');
    const dashboardEnd = new Date(dateRange.endDate + 'T23:59:59');

    const kpis = (project.kpis || []).filter(kpi => {
        const { start, end } = getTimeframeRange(kpi.timeframe);
        return start < dashboardEnd && end > dashboardStart;
    });

    const okrs = (project.okrs || []).filter(okr => {
        const { start, end } = getTimeframeRange(okr.timeframe);
        return start < dashboardEnd && end > dashboardStart;
    });
    return { kpisInView: kpis, okrsInView: okrs };
  }, [project.kpis, project.okrs, dateRange]);

  const projectStats = useMemo(() => {
    const total = filteredTasks.length;
    const todo = filteredTasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgress = filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const done = filteredTasks.filter(t => t.status === TaskStatus.DONE).length;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    const statusData = [
        { label: TaskStatus.DONE, value: done, color: '#34d399' },
        { label: TaskStatus.IN_PROGRESS, value: inProgress, color: '#f59e0b' },
        { label: TaskStatus.TODO, value: todo, color: '#60a5fa' },
    ].filter(d => d.value > 0);

    const difficultyData = [
       { label: TaskDifficulty.EASY, value: filteredTasks.filter(t => t.difficulty === TaskDifficulty.EASY).length, color: '#38bdf8' },
       { label: TaskDifficulty.MEDIUM, value: filteredTasks.filter(t => t.difficulty === TaskDifficulty.MEDIUM).length, color: '#f59e0b' },
       { label: TaskDifficulty.HARD, value: filteredTasks.filter(t => t.difficulty === TaskDifficulty.HARD).length, color: '#d946ef' },
    ].filter(d => d.value > 0);

    // Goal stats
    const totalKPIs = kpisInView.length;
    const completedKPIs = kpisInView.filter(kpi => calculateKpiProgress(kpi, tasks) >= kpi.target).length;
    const kpiCompletionPercent = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;

    const totalOkrs = okrsInView.length;
    let avgOkrProgress = 0;
    if (totalOkrs > 0) {
        const totalProgress = okrsInView.reduce((acc, okr) => {
            const okrAvg = okr.keyResults.length > 0 ? okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length : 0;
            return acc + okrAvg;
        }, 0);
        avgOkrProgress = Math.round(totalProgress / totalOkrs);
    }


    return { total, todo, inProgress, done, completionPercent, difficultyData, statusData, totalKPIs, completedKPIs, kpiCompletionPercent, avgOkrProgress };
  }, [filteredTasks, kpisInView, okrsInView, tasks]);

  const performanceData = useMemo<PerformanceData[]>(() => {
    const employeeStats = new Map<string, PerformanceData>();
    const projectEmployeeIds = new Set<string>();
    
    filteredTasks.forEach(task => task.assigneeIds.forEach(id => projectEmployeeIds.add(id)));
    kpisInView.forEach(kpi => projectEmployeeIds.add(kpi.employeeId));
    okrsInView.forEach(okr => projectEmployeeIds.add(okr.employeeId));

    projectEmployeeIds.forEach(id => {
      const employee = employeesMap.get(id);
      if (employee) {
        employeeStats.set(id, {
          employee, totalTasks: 0,
          byDifficulty: { [TaskDifficulty.EASY]: 0, [TaskDifficulty.MEDIUM]: 0, [TaskDifficulty.HARD]: 0 },
          byStatus: { [TaskStatus.TODO]: 0, [TaskStatus.IN_PROGRESS]: 0, [TaskStatus.DONE]: 0 },
          kpiCount: 0, kpiCompleted: 0, okrAverageProgress: 0,
        });
      }
    });

    filteredTasks.forEach(task => {
      task.assigneeIds.forEach(assigneeId => {
        if (employeeStats.has(assigneeId)) {
          const stats = employeeStats.get(assigneeId)!;
          stats.totalTasks++;
          stats.byDifficulty[task.difficulty]++;
          stats.byStatus[task.status]++;
        }
      });
    });

    employeeStats.forEach((stats, id) => {
        const employeeKpis = kpisInView.filter(k => k.employeeId === id);
        stats.kpiCount = employeeKpis.length;
        stats.kpiCompleted = employeeKpis.filter(kpi => calculateKpiProgress(kpi, tasks) >= kpi.target).length;

        const employeeOkrs = okrsInView.filter(o => o.employeeId === id);
        if (employeeOkrs.length > 0) {
            const totalKrProgress = employeeOkrs.reduce((acc, okr) => {
                const okrProgress = okr.keyResults.length > 0 ? okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length : 0;
                return acc + okrProgress;
            }, 0);
            stats.okrAverageProgress = Math.round(totalKrProgress / employeeOkrs.length);
        }
    });

    return Array.from(employeeStats.values()).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [filteredTasks, employeesMap, kpisInView, okrsInView, tasks]);

  return (
    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="text-xl font-bold text-white">
          Báo cáo hiệu suất - <span className="text-indigo-400">{project.name}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2"><label htmlFor="startDate" className="text-sm text-gray-300">Từ:</label><input type="date" name="startDate" id="startDate" value={dateRange.startDate} onChange={handleDateChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/></div>
            <div className="flex items-center gap-2"><label htmlFor="endDate" className="text-sm text-gray-300">Đến:</label><input type="date" name="endDate" id="endDate" value={dateRange.endDate} onChange={handleDateChange} className="bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/></div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tổng Công việc" value={projectStats.total} icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} color="bg-blue-500/30" />
        <KpiCard title="Hoàn thành" value={projectStats.done} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-green-500/30" />
        <KpiCard title="Đang làm" value={projectStats.inProgress} icon={<ClockIcon className="w-6 h-6"/>} color="bg-yellow-500/30" />
        <KpiCard title="Cần làm" value={projectStats.todo} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>} color="bg-sky-500/30" />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-semibold text-gray-300">Tiến độ Công việc</span>
            <span className="font-bold text-white">{projectStats.completionPercent}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${projectStats.completionPercent}%`}}></div>
        </div>
      </div>

      {/* Goal Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUpIcon className="w-5 h-5 text-indigo-400"/>
                    <h4 className="font-bold text-white">Tổng quan KPIs</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">Tỷ lệ hoàn thành các chỉ số hiệu suất chính.</p>
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-semibold text-gray-300">{projectStats.completedKPIs} / {projectStats.totalKPIs} KPIs hoàn thành</span>
                    <span className="font-bold text-white">{projectStats.kpiCompletionPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{width: `${projectStats.kpiCompletionPercent}%`}}></div>
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                 <div className="flex items-center gap-2 mb-2">
                    <CheckBadgeIcon className="w-5 h-5 text-teal-400"/>
                    <h4 className="font-bold text-white">Tổng quan OKRs</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">Tiến độ trung bình của các mục tiêu và kết quả chính.</p>
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-semibold text-gray-300">Tiến độ trung bình</span>
                    <span className="font-bold text-white">{projectStats.avgOkrProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-teal-500 h-2.5 rounded-full" style={{width: `${projectStats.avgOkrProgress}%`}}></div>
                </div>
            </div>
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart title="Phân loại theo Trạng thái" data={projectStats.statusData} />
        <DonutChart title="Phân loại theo Độ khó" data={projectStats.difficultyData} />
      </div>

      {/* Team Performance Table */}
      <div>
        <h4 className="font-bold text-white text-lg mb-4">Hiệu suất đội ngũ</h4>
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
            {performanceData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-white">Nhân viên</th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold text-white">Tổng CV</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-white min-w-[200px]">Trạng thái CV</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-white min-w-[200px]">Độ khó CV</th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold text-white">KPIs (HT/Tổng)</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-white min-w-[150px]">Tiến độ OKR</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {performanceData.map(stats => (
                        <tr key={stats.employee.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <img src={stats.employee.avatarUrl} alt={stats.employee.name} className="w-9 h-9 rounded-full"/>
                                    <div>
                                        <p className="font-bold text-white">{stats.employee.name}</p>
                                        <p className="text-gray-400">{stats.employee.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className="font-bold text-lg text-white">{stats.totalTasks}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <StackedProgressBar 
                                    total={stats.totalTasks}
                                    data={[
                                        { value: stats.byStatus[TaskStatus.DONE], color: '#34d399', label: 'Hoàn thành' },
                                        { value: stats.byStatus[TaskStatus.IN_PROGRESS], color: '#f59e0b', label: 'Đang thực hiện' },
                                        { value: stats.byStatus[TaskStatus.TODO], color: '#60a5fa', label: 'Cần làm' },
                                    ]}
                                />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <StackedProgressBar 
                                    total={stats.totalTasks}
                                    data={[
                                        { value: stats.byDifficulty[TaskDifficulty.EASY], color: '#38bdf8', label: 'Dễ' },
                                        { value: stats.byDifficulty[TaskDifficulty.MEDIUM], color: '#f59e0b', label: 'Trung bình' },
                                        { value: stats.byDifficulty[TaskDifficulty.HARD], color: '#d946ef', label: 'Khó' },
                                    ]}
                                />
                            </td>
                             <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className={`font-semibold ${stats.kpiCount > 0 ? 'text-white' : 'text-gray-500'}`}>
                                    {stats.kpiCount > 0 ? `${stats.kpiCompleted} / ${stats.kpiCount}` : 'N/A'}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {stats.okrAverageProgress > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-700 rounded-full h-2 flex-1">
                                            <div className="bg-teal-500 h-2 rounded-full" style={{width: `${stats.okrAverageProgress}%`}}></div>
                                        </div>
                                        <span className="font-semibold text-white w-8 text-right">{stats.okrAverageProgress}%</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500">N/A</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            ) : (
                <div className="text-center py-10 text-gray-500 italic">
                    Không có dữ liệu hiệu suất để hiển thị cho khoảng thời gian đã chọn.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;