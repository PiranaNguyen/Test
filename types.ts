export enum Priority {
  LOW = 'Thấp',
  MEDIUM = 'Trung bình',
  HIGH = 'Cao',
  URGENT = 'Khẩn cấp',
}

export enum TaskStatus {
  TODO = 'Cần làm',
  IN_PROGRESS = 'Đang thực hiện',
  DONE = 'Hoàn thành',
}

export enum TaskDifficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
}

export enum UserRole {
  ADMIN = 'Quản trị viên',
  MEMBER = 'Thành viên',
}

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  password?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  timestamp: string; // ISO string
}

export interface ActivityLog {
  id: string;
  authorId: string;
  action: string;
  timestamp: string; // ISO String
  entity: {
    type: 'task' | 'comment' | 'project';
    id: string;
    title: string;
  };
}

export interface Timeframe {
  period: 'week' | 'month' | 'quarter';
  date: string; // Start date of the period, e.g., '2025-08-01'
}

export interface KeyResult {
  id: string;
  title: string;
  progress: number; // 0-100
}

export interface OKR {
  id: string;
  employeeId: string;
  projectId: string;
  objective: string;
  keyResults: KeyResult[];
  timeframe: Timeframe;
}

export interface KPI {
  id: string;
  employeeId: string;
  projectId: string;
  title: string;
  target: number; // e.g., complete 10 tasks
  timeframe: Timeframe;
}

export interface Project {
  id:string;
  name: string;
  contractUrl?: string;
  milestones: {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    isCompleted: boolean;
  }[];
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
  activityLog: ActivityLog[];
  kpis?: KPI[];
  okrs?: OKR[];
}

export interface Task {
  id: string;
  projectId: string; // Thêm liên kết tới dự án
  sequenceId: number;
  title: string;
  description: string;
  assigneeIds: string[]; // Thay đổi từ assigneeId
  priority: Priority;
  difficulty: TaskDifficulty;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  status: TaskStatus;
  notes: string; // Thêm trường ghi chú
  comments: Comment[]; // Thêm trường bình luận
  tags: string[];
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
}

export interface Notification {
  id: string;
  taskId: string;
  message: string;
  type: 'reminder' | 'overdue';
  isRead: boolean;
  timestamp: string;
  action?: {
    type: 'send_email';
    recipient: string;
    cc?: string;
    subject: string;
    body: string;
  };
}