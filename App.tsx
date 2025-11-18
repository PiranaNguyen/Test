

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Employee, TaskStatus, Comment, Project, Priority, UserRole, Notification, ActivityLog, TaskDifficulty, KPI, OKR, KeyResult, Timeframe } from './types';
import { INITIAL_TASKS, INITIAL_EMPLOYEES, STATUS_STYLES, INITIAL_PROJECTS } from './constants';
import TaskCard from './components/TaskCard';
import EmployeeCard from './components/EmployeeCard';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import EmployeeForm from './components/EmployeeForm';
import ProjectForm from './components/ProjectForm';
import CalendarView from './components/CalendarView';
import GanttChartView from './components/GanttChartView';
import DashboardView from './components/DashboardView';
import PerformanceView from './components/PerformanceView';
import KpiForm from './components/KpiForm';
import OkrForm from './components/OkrForm';
import LoginPage from './components/LoginPage';
import NotificationPanel from './components/NotificationPanel';
import { PlusIcon, BarsArrowUpIcon, BarsArrowDownIcon, MagnifyingGlassIcon, ViewColumnsIcon, CalendarDaysIcon, ChartBarIcon, AdjustmentsHorizontalIcon, ArrowDownTrayIcon, TrashIcon, PencilIcon, ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, BellIcon, ArrowRightOnRectangleIcon, ChartPieIcon, TrendingUpIcon } from './components/icons';

type ViewMode = 'kanban' | 'calendar' | 'gantt' | 'dashboard' | 'performance';

// Helper to load from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
  }
  return defaultValue;
};

const App: React.FC = () => {
  // --- State Management ---
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => loadFromLocalStorage<Employee | null>('currentUser', null));

  const [projects, setProjects] = useState<Project[]>(() => loadFromLocalStorage<Project[]>('projects', INITIAL_PROJECTS));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => loadFromLocalStorage<string | null>('activeProjectId', INITIAL_PROJECTS[0]?.id || null));

  const [tasks, setTasks] = useState<Task[]>(() => loadFromLocalStorage<Task[]>('tasks', INITIAL_TASKS));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromLocalStorage<Employee[]>('employees', INITIAL_EMPLOYEES));
  
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  const [isKpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiToEdit, setKpiToEdit] = useState<KPI | null>(null);
  const [isOkrModalOpen, setOkrModalOpen] = useState(false);
  const [okrToEdit, setOkrToEdit] = useState<OKR | null>(null);

  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>({
    period: 'month',
    date: '2025-08-01'
  });

  const [cardDisplaySettings, setCardDisplaySettings] = useState({
    showDescription: true,
    showNotes: false,
    showComments: true,
  });
  
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // --- LocalStorage Persistence ---
  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('activeProjectId', JSON.stringify(activeProjectId));
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  // --- Data Validation Effect ---
  useEffect(() => {
    if (activeProjectId && !projects.find(p => p.id === activeProjectId)) {
      setActiveProjectId(projects[0]?.id || null);
    } else if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);


  const employeesMap = useMemo(() => new Map(employees.map(emp => [emp.id, emp])), [employees]);

  // --- Memos for Derived State ---
  const tasksForActiveProject = useMemo(() => {
    if (!activeProjectId) return [];
    return tasks.filter(task => task.projectId === activeProjectId);
  }, [tasks, activeProjectId]);

  const filteredTasks = useMemo(() => {
    let results = tasksForActiveProject;

    if (filterAssigneeId !== 'all') {
      results = results.filter(task => task.assigneeIds.includes(filterAssigneeId));
    }

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(task => 
        task.title.toLowerCase().includes(lowercasedQuery) ||
        task.description.toLowerCase().includes(lowercasedQuery) ||
        task.tags?.some(tag => tag.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    return results;
  }, [tasksForActiveProject, filterAssigneeId, searchQuery]);

  const groupedTasks = useMemo(() => {
    const grouped = filteredTasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);

    for (const status in grouped) {
        grouped[status as TaskStatus].sort((a, b) => {
            const dateA = new Date(a.deadline).getTime();
            const dateB = new Date(b.deadline).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }

    return grouped;
  }, [filteredTasks, sortOrder]);
  
  // --- Notification Logic ---
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
  
    const generatedNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
  
    let tasksToNotifyAbout: Task[] = [];
  
    if (currentUser.role === UserRole.ADMIN) {
      tasksToNotifyAbout = tasks.filter(task => task.status !== TaskStatus.DONE);
    } else {
      tasksToNotifyAbout = tasks.filter(task => 
        task.assigneeIds.includes(currentUser.id) && task.status !== TaskStatus.DONE
      );
    }
  
    tasksToNotifyAbout.forEach(task => {
      const deadlineDate = new Date(task.deadline + 'T00:00:00');
      
      const existingNotification = notifications.find(n => n.taskId === task.id && (n.type === 'overdue' || n.type === 'reminder'));
      const isRead = existingNotification ? existingNotification.isRead : false;

      if (deadlineDate.getTime() < today.getTime()) {
        const assignees = task.assigneeIds.map(id => employeesMap.get(id)).filter((e): e is Employee => !!e);
        const assigneesText = assignees.map(a => a.name).join(', ');
        
        if (task.id === 't-demo-overdue' && currentUser.role === UserRole.ADMIN) {
           generatedNotifications.push({
            id: `notif-${task.id}-overdue`,
            taskId: task.id,
            type: 'overdue',
            message: `Công việc "${task.title}" do ${assigneesText} phụ trách đã QUÁ HẠN.`,
            isRead: isRead,
            timestamp: new Date().toISOString(),
            action: {
                type: 'send_email',
                recipient: 'namdang.marketing@gmail.com',
                cc: assignees.map(a => a.email).join(','),
                subject: `[CẢNH BÁO TRỄ HẠN] Công việc: ${task.title}`,
                body: `Chào các bên liên quan,\n\nCông việc "${task.title}" được giao cho ${assigneesText} đã trễ hạn vào ngày ${new Date(task.deadline).toLocaleDateString('vi-VN')}.\n\nYêu cầu các bên khẩn trương xử lý và cập nhật tiến độ.\n\nTrân trọng,\n${currentUser.name}`
            }
          });
        } else {
           generatedNotifications.push({
            id: `notif-${task.id}-overdue`,
            taskId: task.id,
            type: 'overdue',
            message: `Công việc "${task.title}" đã quá hạn.`,
            isRead: isRead,
            timestamp: new Date().toISOString()
          });
        }
      }
      else if (deadlineDate.getTime() === tomorrow.getTime()) {
        generatedNotifications.push({
          id: `notif-${task.id}-reminder`,
          taskId: task.id,
          type: 'reminder',
          message: `Công việc "${task.title}" sẽ đến hạn vào ngày mai.`,
          isRead: isRead,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    setNotifications(generatedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

  }, [tasks, currentUser, employeesMap]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action) return;

    const task = tasks.find(t => t.id === notification.taskId);
    if (task) {
        handleOpenTaskDetailsModal(task);
    }
    setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, isRead: true} : n));
    setNotificationPanelOpen(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
  };

  const addActivityLog = (projectId: string, action: string, entity: ActivityLog['entity']) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      authorId: currentUser.id,
      action,
      timestamp: new Date().toISOString(),
      entity,
    };
    setProjects(prevProjects => prevProjects.map(p => 
        p.id === projectId ? { ...p, activityLog: [newLog, ...p.activityLog] } : p
    ));
  };

  const handleLogin = (employeeId: string, password?: string) => {
    const user = employees.find(emp => emp.id === employeeId);
    if (user && user.password === password) {
      setCurrentUser(user);
    } else {
      alert('Sai mật khẩu hoặc tài khoản không tồn tại.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleProjectFormSubmit = (projectData: Omit<Project, 'id'> | Project) => {
    if ('id' in projectData) {
      setProjects(projects.map(p => p.id === projectData.id ? projectData : p));
    } else {
      const newProject: Project = { 
        ...projectData, 
        id: `p${Date.now()}`,
        milestones: [],
        attachments: [],
        activityLog: [],
        kpis: [],
        okrs: []
      };
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
    }
    setProjectModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (tasks.some(task => task.projectId === projectId)) {
      alert('Không thể xóa dự án vẫn còn công việc.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa dự án này không?')) {
      setProjects(projects.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(projects.length > 1 ? projects.find(p => p.id !== projectId)!.id : null);
      }
    }
  };

  const handleOpenNewTaskModal = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  const handleOpenTaskDetailsModal = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };
  
  const handleTaskFormSubmit = (taskData: Omit<Task, 'id' | 'comments' | 'projectId' | 'sequenceId'> | Omit<Task, 'comments' | 'projectId'>) => {
    if ('id' in taskData) {
        const originalTask = tasks.find(t => t.id === taskData.id);
        if (originalTask && originalTask.status !== taskData.status) {
            addActivityLog(originalTask.projectId, `đã đổi trạng thái công việc thành "${taskData.status}" cho`, {type: 'task', id: taskData.id, title: taskData.title});
        }

        setTasks(tasks.map(t => t.id === taskData.id ? { ...tasks.find(t => t.id === (taskData as any).id)!, ...taskData } as Task : t));
    } else {
      if (!activeProjectId) return;
      const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
      const nextSequenceId = (projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.sequenceId)) : 0) + 1;
      
      const newTask: Task = { ...taskData, id: `t${Date.now()}`, comments: [], projectId: activeProjectId, sequenceId: nextSequenceId, difficulty: taskData.difficulty || TaskDifficulty.MEDIUM } as Task;
      setTasks([...tasks, newTask]);
      addActivityLog(activeProjectId, 'đã tạo công việc', {type: 'task', id: newTask.id, title: newTask.title});
    }
    setTaskModalOpen(false);
  };

  const handleAddComment = (taskId: string, commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = { ...commentData, id: `c${Date.now()}`, timestamp: new Date().toISOString() };
    let updatedTask: Task | null = null;
    const newTasks = tasks.map(task => {
        if (task.id === taskId) {
            updatedTask = { ...task, comments: [...task.comments, newComment] };
            return updatedTask;
        }
        return task;
    });
    setTasks(newTasks);
    if (updatedTask) {
        setTaskToEdit(updatedTask);
        addActivityLog(updatedTask.projectId, 'đã bình luận về công việc', { type: 'task', id: updatedTask.id, title: updatedTask.title });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete && window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
       addActivityLog(taskToDelete.projectId, 'đã xóa công việc', { type: 'task', id: taskToDelete.id, title: taskToDelete.title });
    }
  };
  
  const handleTaskDrop = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      addActivityLog(task.projectId, `đã đổi trạng thái công việc thành "${newStatus}" cho`, {type: 'task', id: task.id, title: task.title});
    }
  };

  const handleOpenNewEmployeeModal = () => {
    setEmployeeToEdit(null);
    setEmployeeModalOpen(true);
  };

  const handleOpenEditEmployeeModal = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setEmployeeModalOpen(true);
  };

  const handleEmployeeFormSubmit = (employeeData: Omit<Employee, 'id' | 'avatarUrl'> | Omit<Employee, 'avatarUrl'>) => {
      if ('id' in employeeData) {
        const { password, ...restData } = employeeData;
        const existingEmployee = employees.find(e => e.id === employeeData.id)!;
        
        const updatedEmployee = {
          ...existingEmployee,
          ...restData,
          password: password || existingEmployee.password,
        };

        setEmployees(employees.map(e => e.id === employeeData.id ? updatedEmployee : e));
      } else {
        const newEmployee: Employee = {
          ...(employeeData as any),
          id: `e${Date.now()}`,
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/100`,
        };
        setEmployees([...employees, newEmployee]);
      }
      setEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (tasks.some(task => task.assigneeIds.includes(employeeId))) {
        alert('Không thể xóa nhân viên đang được giao việc.');
        return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
        setEmployees(employees.filter(e => e.id !== employeeId));
    }
  };

   const handleKpiFormSubmit = (kpiData: Omit<KPI, 'id'>) => {
      setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== activeProjectId) return p;
          let updatedKpis = [...(p.kpis || [])];
          if (kpiToEdit) {
              updatedKpis = updatedKpis.map(k => k.id === kpiToEdit.id ? { ...kpiToEdit, ...kpiData } : k);
          } else {
              updatedKpis.push({ ...kpiData, id: `kpi-${Date.now()}` });
          }
          return { ...p, kpis: updatedKpis };
      }));
      setKpiModalOpen(false);
      setKpiToEdit(null);
  };

  const handleDeleteKpi = (kpiId: string) => {
      if (!window.confirm("Bạn có chắc muốn xóa KPI này?")) return;
      setProjects(prevProjects => prevProjects.map(p => 
          p.id === activeProjectId ? { ...p, kpis: (p.kpis || []).filter(k => k.id !== kpiId) } : p
      ));
  };
  
  const handleOkrFormSubmit = (okrData: Omit<OKR, 'id'>) => {
      setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== activeProjectId) return p;
          let updatedOkrs = [...(p.okrs || [])];
          if (okrToEdit) {
              updatedOkrs = updatedOkrs.map(o => o.id === okrToEdit.id ? { ...okrToEdit, ...okrData } : o);
          } else {
              updatedOkrs.push({ ...okrData, id: `okr-${Date.now()}` });
          }
          return { ...p, okrs: updatedOkrs };
      }));
      setOkrModalOpen(false);
      setOkrToEdit(null);
  };

  const handleDeleteOkr = (okrId: string) => {
      if (!window.confirm("Bạn có chắc muốn xóa OKR này?")) return;
      setProjects(prevProjects => prevProjects.map(p =>
          p.id === activeProjectId ? { ...p, okrs: (p.okrs || []).filter(o => o.id !== okrId) } : p
      ));
  };

  const handleUpdateKeyResultProgress = (okrId: string, krId: string, progress: number) => {
      setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== activeProjectId) return p;
          const updatedOkrs = (p.okrs || []).map(okr => {
              if (okr.id !== okrId) return okr;
              const updatedKeyResults = okr.keyResults.map(kr => 
                  kr.id === krId ? { ...kr, progress } : kr
              );
              return { ...okr, keyResults: updatedKeyResults };
          });
          return { ...p, okrs: updatedOkrs };
      }));
  };

  const statusIcons: { [key in TaskStatus]: React.ReactNode } = {
    [TaskStatus.TODO]: <ClipboardDocumentListIcon className="w-6 h-6" />,
    [TaskStatus.IN_PROGRESS]: <ClockIcon className="w-6 h-6" />,
    [TaskStatus.DONE]: <CheckCircleIcon className="w-6 h-6" />,
  };
  
  // FIX: Changed title prop from string to TaskStatus to match the type being passed.
  const KanbanColumn = ({ title, tasks, status }: { title: TaskStatus, tasks: Task[], status: TaskStatus }) => {
    const { border, text, bg } = STATUS_STYLES[status];
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleTaskDrop(e.dataTransfer.getData('taskId'), status);
      setDragOverColumn(null);
    };
    return (
        <div 
          className={`rounded-lg flex flex-col w-[300px] sm:w-[350px] flex-shrink-0 snap-start transition-colors ${bg} border border-gray-700/50 ${dragOverColumn === status ? 'bg-indigo-900/40' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnter={() => setDragOverColumn(status)}
          onDragLeave={() => setDragOverColumn(null)}
        >
            <div className={`flex items-center gap-3 font-semibold p-3 rounded-t-lg border-b-2 ${border} ${text}`}>
                {statusIcons[status]}
                <h3 className="text-lg tracking-wide">{title} <span className="text-sm font-normal text-gray-400">({tasks.length})</span></h3>
            </div>
            <div className="space-y-4 flex-grow overflow-y-auto p-4">
                 {tasks.length > 0 ? (
                    tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task}
                            assignees={task.assigneeIds.map(id => employeesMap.get(id)!).filter(Boolean)}
                            currentUser={currentUser!}
                            onOpenDetails={handleOpenTaskDetailsModal}
                            onDelete={handleDeleteTask}
                            displaySettings={cardDisplaySettings}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 italic p-4 border-2 border-dashed border-gray-700 rounded-md">
                        Kéo và thả công việc vào đây
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const ProjectSelector = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
             <select 
                id="project-selector"
                value={activeProjectId || ''}
                onChange={e => setActiveProjectId(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-lg font-bold rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-full sm:w-auto flex-grow"
                aria-label="Chọn dự án"
            >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {activeProject && currentUser?.role === UserRole.ADMIN && (
                 <div className="flex items-center gap-2">
                    <button onClick={() => {setProjectToEdit(activeProject); setProjectModalOpen(true);}} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-full transition"><PencilIcon/></button>
                    <button onClick={() => handleDeleteProject(activeProject.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition"><TrashIcon/></button>
                </div>
            )}
             {currentUser?.role === UserRole.ADMIN && (
                <button onClick={() => { setProjectToEdit(null); setProjectModalOpen(true); }} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition text-sm font-semibold">
                    <PlusIcon className="w-5 h-5"/> <span>Dự án mới</span>
                </button>
            )}
        </div>
    );
  };

  const ViewModeToggle = () => (
    <div className="bg-gray-700 p-1 rounded-lg flex items-center w-full justify-center">
      <button onClick={() => setViewMode('kanban')} className={`flex-1 justify-center flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><ViewColumnsIcon className="w-5 h-5" /> <span className="hidden sm:inline">Bảng</span></button>
      <button onClick={() => setViewMode('calendar')} className={`flex-1 justify-center flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><CalendarDaysIcon className="w-5 h-5" /> <span className="hidden sm:inline">Lịch</span></button>
      <button onClick={() => setViewMode('gantt')} className={`flex-1 justify-center flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'gantt' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><ChartBarIcon className="w-5 h-5" /> <span className="hidden sm:inline">Gantt</span></button>
      <button onClick={() => setViewMode('dashboard')} className={`flex-1 justify-center flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><ChartPieIcon className="w-5 h-5" /> <span className="hidden sm:inline">Báo cáo</span></button>
      <button onClick={() => setViewMode('performance')} className={`flex-1 justify-center flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition ${viewMode === 'performance' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><TrendingUpIcon className="w-5 h-5" /> <span className="hidden sm:inline">Hiệu suất</span></button>
    </div>
  );

  const FilterControls = () => (
      <>
          <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chế độ xem</label>
              <ViewModeToggle />
          </div>
          <div>
              <label htmlFor="modal-search" className="block text-sm font-medium text-gray-300 mb-2">Tìm kiếm</label>
              <div className="relative">
                  <input id="modal-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm công việc..." className="bg-gray-700 border-gray-600 rounded-md p-2 pl-10 w-full"/>
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
          </div>
          <div>
              <label htmlFor="modal-assignee" className="block text-sm font-medium text-gray-300 mb-2">Người thực hiện</label>
              <select id="modal-assignee" value={filterAssigneeId} onChange={e => setFilterAssigneeId(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                  <option value="all">Tất cả nhân viên</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sắp xếp theo deadline</label>
              <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 w-full bg-gray-700 rounded-md flex items-center justify-center gap-2 hover:bg-gray-600 transition">
                  {sortOrder === 'asc' ? <BarsArrowUpIcon /> : <BarsArrowDownIcon />}
                  <span>{sortOrder === 'asc' ? 'Cũ nhất trước' : 'Mới nhất trước'}</span>
              </button>
          </div>
      </>
  );

  if (!currentUser) {
    return <LoginPage employees={employees} onLogin={handleLogin} />;
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-40 border-b border-gray-700 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl sm:text-3xl font-bold text-white tracking-wider">Bảng điều khiển công việc</h1>
        <div className="flex items-center gap-2 sm:gap-4">
            <div ref={notificationRef} className="relative">
              <button onClick={() => setNotificationPanelOpen(prev => !prev)} className="relative text-gray-300 hover:text-white p-2 hover:bg-gray-700 rounded-full transition">
                <BellIcon className="w-6 h-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full ring-2 ring-gray-800 bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {isNotificationPanelOpen && (
                <NotificationPanel 
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClose={() => setNotificationPanelOpen(false)}
                />
              )}
            </div>

            <div className="text-right hidden sm:block">
                <p className="font-semibold text-white">{currentUser.name}</p>
                <p className="text-sm text-indigo-300">{currentUser.role}</p>
            </div>
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full"/>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-sm text-white rounded-md hover:bg-red-600 transition">
                <ArrowRightOnRectangleIcon className="w-5 h-5"/>
                <span className="hidden md:inline">Đăng xuất</span>
            </button>
        </div>
      </header>
      
      <main className="p-4 md:p-8 space-y-8">
        <section id="projects">
            <h2 className="text-2xl font-bold text-white mb-4">Dự án</h2>
            <ProjectSelector />
        </section>

        <div className="border-t border-gray-700 my-8"></div>

        {activeProjectId && activeProject ? (
          <>
            <section id="tasks">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-white">Công việc</h2>
                    
                    <div className="flex items-center gap-2 flex-wrap justify-end flex-grow">
                        <div className="hidden md:flex items-center gap-4 flex-wrap">
                            <ViewModeToggle />
                            {viewMode !== 'dashboard' && viewMode !== 'performance' && (
                                <>
                                    <div className="relative">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm công việc..." className="bg-gray-700 border-gray-600 rounded-md p-2 pl-10 w-full sm:w-auto"/>
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    <select value={filterAssigneeId} onChange={e => setFilterAssigneeId(e.target.value)} className="bg-gray-700 border-gray-600 rounded-md p-2">
                                        <option value="all">Tất cả nhân viên</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                    </select>
                                    <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition" aria-label={sortOrder === 'asc' ? 'Sắp xếp giảm dần' : 'Sắp xếp tăng dần'}>
                                        {sortOrder === 'asc' ? <BarsArrowUpIcon /> : <BarsArrowDownIcon />}
                                    </button>
                                </>
                            )}
                        </div>
                        
                         {viewMode !== 'dashboard' && viewMode !== 'performance' && (
                            <button onClick={() => setFilterModalOpen(true)} className="md:hidden flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition">
                                <AdjustmentsHorizontalIcon className="w-5 h-5"/>
                                <span className="text-sm">Tùy chọn</span>
                            </button>
                         )}
                        
                        <button onClick={handleOpenNewTaskModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">
                            <PlusIcon className="w-5 h-5"/> 
                            <span className="hidden sm:inline">Thêm mới</span>
                        </button>
                    </div>
                </div>

                {viewMode === 'kanban' ? (
                    <div className="flex gap-6 overflow-x-auto pb-4 -mb-4 snap-x snap-mandatory">
                        {(Object.values(TaskStatus) as TaskStatus[]).map(status => (
                            <KanbanColumn key={status} title={status} tasks={groupedTasks[status] || []} status={status} />
                        ))}
                    </div>
                ) : viewMode === 'calendar' ? (
                    <CalendarView tasks={filteredTasks} currentDate={currentDate} onDateChange={setCurrentDate} onTaskClick={handleOpenTaskDetailsModal} />
                ) : viewMode === 'gantt' ? (
                    <GanttChartView tasks={filteredTasks} employeesMap={employeesMap} currentDate={currentDate} onDateChange={setCurrentDate} onTaskClick={handleOpenTaskDetailsModal} />
                ) : viewMode === 'dashboard' ? (
                    <DashboardView 
                        tasks={tasksForActiveProject} 
                        employees={employees}
                        project={activeProject}
                     />
                ) : (
                    <PerformanceView
                        project={activeProject}
                        employees={employees}
                        tasks={tasks}
                        currentUser={currentUser}
                        currentTimeframe={currentTimeframe}
                        onSetCurrentTimeframe={setCurrentTimeframe}
                        onEditKpi={(kpi) => { setKpiToEdit(kpi); setKpiModalOpen(true); }}
                        onDeleteKpi={handleDeleteKpi}
                        onAddKpi={() => { setKpiToEdit(null); setKpiModalOpen(true); }}
                        onEditOkr={(okr) => { setOkrToEdit(okr); setOkrModalOpen(true); }}
                        onDeleteOkr={handleDeleteOkr}
                        onAddOkr={() => { setOkrToEdit(null); setOkrModalOpen(true); }}
                        onUpdateKeyResultProgress={handleUpdateKeyResultProgress}
                    />
                )}
            </section>
            
            {currentUser.role === UserRole.ADMIN && (
                <section id="employees">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Quản lý nhân viên</h2>
                    <button onClick={handleOpenNewEmployeeModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">
                      <PlusIcon className="w-5 h-5"/> <span className="hidden sm:inline">Thêm nhân viên</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => (
                      <EmployeeCard key={emp.id} employee={emp} currentUser={currentUser} onEdit={handleOpenEditEmployeeModal} onDelete={handleDeleteEmployee} />
                    ))}
                  </div>
                </section>
            )}
          </>
        ) : (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold text-white">Chào mừng bạn!</h3>
                <p className="text-gray-400 mt-2">Vui lòng chọn một dự án để bắt đầu, hoặc tạo một dự án mới.</p>
            </div>
        )}
      </main>

      <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title={taskToEdit ? 'Chi tiết công việc' : 'Tạo công việc mới'}>
        <TaskForm onSubmit={handleTaskFormSubmit} onCancel={() => setTaskModalOpen(false)} onAddComment={handleAddComment} employees={employees} taskToEdit={taskToEdit} currentUser={currentUser} />
      </Modal>

      <Modal isOpen={isEmployeeModalOpen} onClose={() => setEmployeeModalOpen(false)} title={employeeToEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}>
        <EmployeeForm onSubmit={handleEmployeeFormSubmit} onCancel={() => setEmployeeModalOpen(false)} employeeToEdit={employeeToEdit} />
      </Modal>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title={projectToEdit ? 'Chi tiết dự án' : 'Tạo dự án mới'}>
          <ProjectForm onSubmit={handleProjectFormSubmit} onCancel={() => setProjectModalOpen(false)} projectToEdit={projectToEdit} employees={employees} />
      </Modal>
      
      <Modal isOpen={isKpiModalOpen} onClose={() => { setKpiModalOpen(false); setKpiToEdit(null); }} title={kpiToEdit ? 'Chỉnh sửa KPI' : 'Tạo KPI mới'}>
          <KpiForm 
            onSubmit={handleKpiFormSubmit}
            onCancel={() => { setKpiModalOpen(false); setKpiToEdit(null); }}
            kpiToEdit={kpiToEdit}
            employees={employees.filter(e => e.role === UserRole.MEMBER)}
            projectId={activeProjectId!}
            timeframe={kpiToEdit?.timeframe || currentTimeframe}
          />
      </Modal>

       <Modal isOpen={isOkrModalOpen} onClose={() => { setOkrModalOpen(false); setOkrToEdit(null); }} title={okrToEdit ? 'Chỉnh sửa OKR' : 'Tạo OKR mới'}>
          <OkrForm 
            onSubmit={handleOkrFormSubmit}
            onCancel={() => { setOkrModalOpen(false); setOkrToEdit(null); }}
            okrToEdit={okrToEdit}
            employeeId={currentUser.id}
            projectId={activeProjectId!}
            timeframe={okrToEdit?.timeframe || currentTimeframe}
          />
      </Modal>

      <Modal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} title="Bộ lọc & Tùy chọn">
          <div className="flex flex-col gap-4">
              <FilterControls />
          </div>
      </Modal>

    </div>
  );
};

export default App;