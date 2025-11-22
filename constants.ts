
import { Priority, TaskStatus, Employee, Task, Project, UserRole, TaskDifficulty, KPI, OKR } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Nguyễn Văn An', avatarUrl: 'https://picsum.photos/seed/1/100', role: UserRole.ADMIN, email: 'an.nguyen@company.com', phone: '0901234567', dob: '1985-05-15', password: '123456' },
  { id: '2', name: 'Trần Thị Bích', avatarUrl: 'https://picsum.photos/seed/2/100', role: UserRole.MEMBER, email: 'bich.tran@company.com', phone: '0912345678', dob: '1992-11-20', password: 'memberpassword1' },
  { id: '3', name: 'Lê Minh Cường', avatarUrl: 'https://picsum.photos/seed/3/100', role: UserRole.MEMBER, email: 'cuong.le@company.com', phone: '0987654321', dob: '1995-02-10', password: 'memberpassword2' },
];

const DEMO_KPIS: KPI[] = [
    // KPI mới theo yêu cầu: Hoàn thành task khó (Chuyển sang Q4 để hiển thị mặc định)
    { 
        id: 'kpi1', 
        employeeId: '1', 
        projectId: 'p1', 
        title: 'Hoàn thành 5 công việc độ khó "Khó" (Hard)', 
        target: 5, 
        timeframe: { period: 'quarter', date: '2025-10-01' } 
    },
    { 
        id: 'kpi2', 
        employeeId: '2', 
        projectId: 'p1', 
        title: 'Hoàn thành 5 công việc độ khó "Khó" (Hard)', 
        target: 5, 
        timeframe: { period: 'quarter', date: '2025-10-01' } 
    },
    { 
        id: 'kpi3', 
        employeeId: '3', 
        projectId: 'p1', 
        title: 'Hoàn thành 5 công việc độ khó "Khó" (Hard)', 
        target: 5, 
        timeframe: { period: 'quarter', date: '2025-10-01' } 
    },
    // KPI chuyên môn (Q4)
    { 
        id: 'kpi4', 
        employeeId: '1', 
        projectId: 'p1', 
        title: 'Review và Merge 100% Pull Request trước deadline', 
        target: 10, 
        timeframe: { period: 'quarter', date: '2025-10-01' } 
    },
    { 
        id: 'kpi5', 
        employeeId: '2', 
        projectId: 'p1', 
        title: 'Thiết kế UI/UX cho 15 màn hình phức tạp', 
        target: 15, 
        timeframe: { period: 'quarter', date: '2025-10-01' } 
    }
];

const DEMO_OKRS: OKR[] = [
    {
        id: 'okr1',
        employeeId: '1',
        projectId: 'p1',
        objective: 'Đẩy mạnh chất lượng kỹ thuật và xử lý các bài toán khó trong Q4',
        keyResults: [
            { id: 'kr1-1', title: 'Hoàn thành 100% các công việc Backend phức tạp đúng hạn', progress: 40 },
            { id: 'kr1-2', title: 'Giảm nợ kỹ thuật (Technical Debt) xuống dưới 5%', progress: 60 },
        ],
        timeframe: { period: 'quarter', date: '2025-10-01' }
    },
    {
        id: 'okr2',
        employeeId: '2',
        projectId: 'p1',
        objective: 'Tối ưu hóa trải nghiệm người dùng trong mùa cao điểm cuối năm',
        keyResults: [
            { id: 'kr2-1', title: 'Hoàn thành thiết kế High-Fidelity cho toàn bộ luồng thanh toán', progress: 50 },
            { id: 'kr2-2', title: 'Đạt sự đồng thuận 100% từ team Dev về tính khả thi', progress: 20 }
        ],
        timeframe: { period: 'quarter', date: '2025-10-01' }
    },
    {
        id: 'okr3',
        employeeId: '3',
        projectId: 'p1',
        objective: 'Đảm bảo sự ổn định hệ thống khi chịu tải cao dịp lễ',
        keyResults: [
            { id: 'kr3-1', title: 'Xử lý dứt điểm các vấn đề về hiệu năng database', progress: 90 },
            { id: 'kr3-2', title: 'Tối ưu thời gian phản hồi API xuống dưới 200ms', progress: 75 }
        ],
        timeframe: { period: 'quarter', date: '2025-10-01' }
    },
    {
        id: 'okr4',
        employeeId: '1',
        projectId: 'p1',
        objective: 'Nâng cao năng lực đội ngũ qua đào tạo nội bộ',
        keyResults: [
            { id: 'kr4-1', title: 'Tổ chức 3 buổi workshop về Microservices', progress: 33 },
            { id: 'kr4-2', title: 'Mentoring thành công cho 2 junior developers', progress: 50 }
        ],
        timeframe: { period: 'quarter', date: '2025-10-01' }
    },
    {
        id: 'okr5',
        employeeId: '2',
        projectId: 'p1',
        objective: 'Đồng bộ hóa Design System',
        keyResults: [
            { id: 'kr5-1', title: 'Cập nhật 100% component trong thư viện Figma', progress: 80 },
            { id: 'kr5-2', title: 'Viết tài liệu hướng dẫn sử dụng cho Dev', progress: 10 }
        ],
        timeframe: { period: 'quarter', date: '2025-10-01' }
    }
];

export const INITIAL_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    name: 'Dự án Alpha (Quý 4/2025)',
    contractUrl: 'https://docs.google.com/document/d/example',
    milestones: [
        { id: 'm1', name: 'Chốt danh sách tính năng Giai đoạn 2', date: '2025-11-05', isCompleted: true },
        { id: 'm2', name: 'Hoàn thành Core Backend', date: '2025-11-20', isCompleted: false },
        { id: 'm3', name: 'UAT Testing', date: '2025-11-28', isCompleted: false },
    ],
    attachments: [
        { id: 'a1', name: 'Bản đặc tả yêu cầu v2', url: 'https://docs.google.com/document/d/example2' },
        { id: 'a2', name: 'Kế hoạch tháng 11', url: 'https://docs.google.com/spreadsheets/d/example' },
    ],
    activityLog: [
      { id: 'ac1', authorId: '1', action: 'đã cập nhật tiến độ', timestamp: '2025-11-01T10:00:00Z', entity: { type: 'task', id: 't1', title: 'Thiết kế giao diện người dùng' } },
    ],
    kpis: DEMO_KPIS,
    okrs: DEMO_OKRS,
  },
  { 
    id: 'p2', 
    name: 'Chiến dịch Marketing Mùa Đông',
    contractUrl: '',
    milestones: [],
    attachments: [],
    activityLog: [],
    kpis: [],
    okrs: [],
  },
];

export const INITIAL_TASKS: Task[] = [
  // === Project Alpha (p1) Tasks - Tháng 11 ===
  // Cập nhật nhiều task thành HARD để test KPI
  {
    id: 't1',
    projectId: 'p1',
    sequenceId: 1,
    title: 'Thiết kế UI Dashboard phức tạp',
    description: 'Tạo wireframe và mockup chi tiết cho màn hình Dashboard với nhiều biểu đồ động.',
    assigneeIds: ['1', '2'], // Gán cho An (1) và Bích (2)
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-01',
    deadline: '2025-11-10',
    status: TaskStatus.DONE,
    notes: 'Yêu cầu độ chính xác cao về Grid system.',
    comments: [],
    tags: ['UI/UX', 'Dashboard'],
    attachments: [],
  },
  {
    id: 't2',
    projectId: 'p1',
    sequenceId: 2,
    title: 'Refactor Core API Authentication',
    description: 'Viết lại module xác thực để hỗ trợ OAuth2 và Multi-factor Authentication.',
    assigneeIds: ['1', '3'], // Gán cho An (1) và Cường (3)
    priority: Priority.URGENT,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-02',
    deadline: '2025-11-12',
    status: TaskStatus.IN_PROGRESS,
    notes: 'Cần bảo mật tuyệt đối.',
    comments: [],
    tags: ['Backend', 'Security'],
    attachments: [],
  },
  {
    id: 't3',
    projectId: 'p1',
    sequenceId: 3,
    title: 'Tối ưu Query Database cho Báo cáo',
    description: 'Tối ưu các câu lệnh SQL phức tạp đang gây chậm hệ thống.',
    assigneeIds: ['3'], // Gán cho Cường (3)
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-05',
    deadline: '2025-11-15',
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['Database', 'Performance'],
    attachments: [],
  },
  {
    id: 't4',
    projectId: 'p1',
    sequenceId: 4,
    title: 'Xây dựng Microservice Payment',
    description: 'Tách module thanh toán ra thành service riêng biệt.',
    assigneeIds: ['1'], // Gán cho An (1)
    priority: Priority.URGENT,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-10',
    deadline: '2025-11-25',
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['Microservices', 'Payment'],
    attachments: [],
  },
  {
    id: 't5',
    projectId: 'p1',
    sequenceId: 5,
    title: 'Thiết kế System Architecture v2',
    description: 'Vẽ sơ đồ kiến trúc hệ thống mới để scale lên 1 triệu users.',
    assigneeIds: ['1', '3'], // Gán cho An (1) và Cường (3)
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-01',
    deadline: '2025-11-08',
    status: TaskStatus.DONE,
    notes: '',
    comments: [],
    tags: ['Architecture'],
    attachments: [],
  },
  {
    id: 't6',
    projectId: 'p1',
    sequenceId: 6,
    title: 'Implement Real-time Notification',
    description: 'Sử dụng WebSocket để làm tính năng thông báo thời gian thực.',
    assigneeIds: ['2'], // Gán cho Bích (2)
    priority: Priority.MEDIUM,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-12',
    deadline: '2025-11-18',
    status: TaskStatus.IN_PROGRESS,
    notes: '',
    comments: [],
    tags: ['Frontend', 'WebSocket'],
    attachments: [],
  },
  {
    id: 't7',
    projectId: 'p1',
    sequenceId: 7,
    title: 'Migration dữ liệu cũ',
    description: 'Chuyển đổi 50GB dữ liệu từ hệ thống cũ sang hệ thống mới.',
    assigneeIds: ['3'], // Gán cho Cường (3)
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-20',
    deadline: '2025-11-30',
    status: TaskStatus.TODO,
    notes: 'Rủi ro mất dữ liệu cao, cần backup kỹ.',
    comments: [],
    tags: ['Data', 'Migration'],
    attachments: [],
  },
  {
    id: 't8',
    projectId: 'p1',
    sequenceId: 8,
    title: 'Tích hợp AI Recommendation',
    description: 'Tích hợp model AI gợi ý sản phẩm vào trang chủ.',
    assigneeIds: ['2'], // Gán cho Bích (2)
    priority: Priority.MEDIUM,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-15',
    deadline: '2025-11-25',
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['AI', 'Integration'],
    attachments: [],
  },
  {
    id: 't9',
    projectId: 'p1',
    sequenceId: 9,
    title: 'Kiểm thử bảo mật (Pentest)',
    description: 'Thực hiện tấn công giả lập để tìm lỗ hổng.',
    assigneeIds: ['1', '2', '3'], // Cả 3
    priority: Priority.URGENT,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-25',
    deadline: '2025-11-29',
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['Security', 'QA'],
    attachments: [],
  },
  {
    id: 't10',
    projectId: 'p1',
    sequenceId: 10,
    title: 'Phát triển Mobile App Module Chat',
    description: 'Code module chat native trên iOS và Android.',
    assigneeIds: ['2'], // Gán cho Bích (2)
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.HARD, // KPI HARD
    startDate: '2025-11-05',
    deadline: '2025-11-20',
    status: TaskStatus.DONE,
    notes: '',
    comments: [],
    tags: ['Mobile', 'React Native'],
    attachments: [],
  },
  {
    id: 't11',
    projectId: 'p1',
    sequenceId: 11,
    title: 'Viết Unit Test Coverage 90%',
    description: 'Bổ sung test case cho toàn bộ các module core.',
    assigneeIds: ['1', '2', '3'],
    priority: Priority.MEDIUM,
    difficulty: TaskDifficulty.MEDIUM,
    startDate: '2025-11-01',
    deadline: '2025-11-30',
    status: TaskStatus.IN_PROGRESS,
    notes: '',
    comments: [],
    tags: ['Testing'],
    attachments: [],
  },
  // === Project 2 Tasks (Marketing) - Tháng 11 ===
  {
    id: 't12',
    projectId: 'p2',
    sequenceId: 1,
    title: 'Lên kế hoạch Content Giáng Sinh',
    description: 'Chuẩn bị nội dung cho chiến dịch tháng 12.',
    assigneeIds: ['2'],
    priority: Priority.MEDIUM,
    difficulty: TaskDifficulty.MEDIUM,
    startDate: '2025-11-15',
    deadline: '2025-11-25',
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['Marketing'],
    attachments: [],
  },
  {
    id: 't-demo-overdue',
    projectId: 'p1',
    sequenceId: 99,
    title: 'Báo cáo tiến độ đầu tháng 11',
    description: 'Task demo quá hạn để test thông báo.',
    assigneeIds: ['1'],
    priority: Priority.HIGH,
    difficulty: TaskDifficulty.EASY,
    startDate: '2025-11-01',
    deadline: '2025-11-03', // Quá hạn nếu xem vào giữa tháng 11
    status: TaskStatus.TODO,
    notes: '',
    comments: [],
    tags: ['Report'],
    attachments: [],
  }
];

export const PRIORITY_STYLES: { [key in Priority]: { base: string; text: string } } = {
  [Priority.LOW]: { base: 'bg-green-500/10', text: 'text-green-400' },
  [Priority.MEDIUM]: { base: 'bg-yellow-500/10', text: 'text-yellow-400' },
  [Priority.HIGH]: { base: 'bg-orange-500/10', text: 'text-orange-400' },
  [Priority.URGENT]: { base: 'bg-red-500/10', text: 'text-red-400' },
};

export const DIFFICULTY_STYLES: { [key in TaskDifficulty]: { base: string; text: string } } = {
  [TaskDifficulty.EASY]: { base: 'bg-sky-500/10', text: 'text-sky-400' },
  [TaskDifficulty.MEDIUM]: { base: 'bg-amber-500/10', text: 'text-amber-400' },
  [TaskDifficulty.HARD]: { base: 'bg-fuchsia-500/10', text: 'text-fuchsia-400' },
};

export const STATUS_STYLES: { [key in TaskStatus]: { border: string; text: string; bg: string; } } = {
    [TaskStatus.TODO]: { border: 'border-blue-500', text: 'text-blue-300', bg: 'bg-blue-900/30' },
    [TaskStatus.IN_PROGRESS]: { border: 'border-yellow-500', text: 'text-yellow-300', bg: 'bg-yellow-900/30' },
    [TaskStatus.DONE]: { border: 'border-green-500', text: 'text-green-300', bg: 'bg-green-900/30' },
};
