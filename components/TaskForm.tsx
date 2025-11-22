import React, { useState, useEffect, useMemo } from 'react';
import { Task, Employee, Priority, TaskStatus, Comment, UserRole, TaskDifficulty } from '../types';
import { EnvelopeIcon, PaperClipIcon, TrashIcon, PlusIcon } from './icons';

// Định nghĩa kiểu dữ liệu mà form sẽ gửi đi, không bao gồm các trường do hệ thống quản lý
type TaskSubmitData = Omit<Task, 'id' | 'comments' | 'projectId' | 'sequenceId'>;
type TaskEditData = Omit<Task, 'comments' | 'projectId'>;

interface TaskFormProps {
  onSubmit: (task: TaskSubmitData | TaskEditData) => void;
  onCancel: () => void;
  onAddComment: (taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  employees: Employee[];
  taskToEdit?: Task | null;
  currentUser: Employee;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, onAddComment, employees, taskToEdit, currentUser }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] =useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string }[]>([]);

  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  
  const [newComment, setNewComment] = useState('');

  const employeesMap = useMemo(() => new Map(employees.map(emp => [emp.id, emp])), [employees]);

  // Logic phân quyền
  const isReadOnly = useMemo(() => {
    if (!taskToEdit) return false; // Form tạo mới luôn cho phép sửa
    if (currentUser.role === UserRole.ADMIN) return false; // Admin luôn có quyền sửa
    // Member chỉ được sửa nếu công việc được giao cho họ
    return !taskToEdit.assigneeIds.includes(currentUser.id);
  }, [taskToEdit, currentUser]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setAssigneeIds(taskToEdit.assigneeIds);
      setPriority(taskToEdit.priority);
      setDifficulty(taskToEdit.difficulty);
      setStartDate(taskToEdit.startDate || '');
      setDeadline(taskToEdit.deadline);
      setStatus(taskToEdit.status);
      setNotes(taskToEdit.notes || '');
      setTags(taskToEdit.tags?.join(', ') || '');
      setAttachments(taskToEdit.attachments || []);
    } else {
      // Reset form cho công việc mới
      setTitle('');
      setDescription('');
      setAssigneeIds([]);
      setPriority(Priority.MEDIUM);
      setDifficulty(TaskDifficulty.MEDIUM);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setDeadline(today);
      setStatus(TaskStatus.TODO);
      setNotes('');
      setTags('');
      setAttachments([]);
    }
  }, [taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly && taskToEdit) { // Chỉ cho phép thay đổi status nếu readonly
        onSubmit({ ...taskToEdit, status });
        return;
    }

    if (!title || !startDate || !deadline) {
      alert("Vui lòng nhập tiêu đề, ngày bắt đầu và deadline.");
      return;
    }
    
    if (new Date(startDate) > new Date(deadline)) {
      alert("Ngày bắt đầu không thể sau ngày kết thúc.");
      return;
    }

    const processedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    const taskData = { title, description, assigneeIds, priority, difficulty, startDate, deadline, status, notes, tags: processedTags, attachments };

    if (taskToEdit) {
      onSubmit({ ...taskData, id: taskToEdit.id, sequenceId: taskToEdit.sequenceId });
    } else {
      onSubmit(taskData as TaskSubmitData);
    }
  };

  const handleAddAttachment = () => {
    if (newAttachmentName.trim() && newAttachmentUrl.trim()) {
      try {
        new URL(newAttachmentUrl); // Validate URL
        setAttachments([...attachments, { id: `temp-${Date.now()}`, name: newAttachmentName, url: newAttachmentUrl }]);
        setNewAttachmentName('');
        setNewAttachmentUrl('');
      } catch (_) {
        alert('Vui lòng nhập một URL hợp lệ.');
      }
    } else {
        alert('Vui lòng nhập cả Tên và URL cho tệp đính kèm.');
    }
  };
  
  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser.id || !taskToEdit) return;
    onAddComment(taskToEdit.id, { authorId: currentUser.id, text: newComment });
    setNewComment('');
  };

  const mailtoHref = useMemo(() => {
    if (!taskToEdit || taskToEdit.assigneeIds.length === 0) return '';
    
    const assignees = taskToEdit.assigneeIds
      .map(id => employeesMap.get(id))
      .filter((e): e is Employee => !!e);
      
    if (assignees.length === 0) return '';
      
    const recipientEmails = assignees.map(a => a.email).join(',');
    const emailSubject = `[NHẮC NHỞ] Công việc: ${taskToEdit.title}`;
    const emailBody = `Chào bạn,\n\nĐây là lời nhắc cho công việc "${taskToEdit.title}".\n\n- Deadline: ${new Date(taskToEdit.deadline).toLocaleDateString('vi-VN')}\n- Mô tả: ${taskToEdit.description}\n\nVui lòng kiểm tra và cập nhật tiến độ công việc của bạn.\n\nTrân trọng,\n${currentUser.name}`;
    
    return `mailto:${recipientEmails}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  }, [taskToEdit, employeesMap, currentUser.name]);

  const formLabelClass = "block text-sm font-medium text-gray-300 mb-1";
  const formInputClass = "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-800 disabled:cursor-not-allowed";

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2 -mr-2">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className={formLabelClass}>Tiêu đề {taskToEdit && <span className="text-gray-400 font-mono">(#{taskToEdit.sequenceId})</span>}</label>
                {/* FIX: Explicitly type event object */}
                <input type="text" id="title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} className={formInputClass} required disabled={isReadOnly} />
            </div>
            <div>
                <label htmlFor="description" className={formLabelClass}>Mô tả</label>
                {/* FIX: Explicitly type event object */}
                <textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} className={formInputClass} rows={3} disabled={isReadOnly}></textarea>
            </div>
            <div>
                <label htmlFor="assignee" className={formLabelClass}>Giao cho</label>
                <select 
                    id="assignee" 
                    multiple 
                    value={assigneeIds} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssigneeIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} 
                    className={`${formInputClass} h-24`} 
                    disabled={isReadOnly}
                >
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="notes" className={formLabelClass}>Ghi chú</label>
                {/* FIX: Explicitly type event object */}
                <textarea id="notes" value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} className={formInputClass} rows={2} placeholder="Thêm ghi chú chi tiết..." disabled={isReadOnly}></textarea>
            </div>
             <div>
                <label htmlFor="tags" className={formLabelClass}>Thẻ (cách nhau bởi dấu phẩy)</label>
                {/* FIX: Explicitly type event object */}
                <input type="text" id="tags" value={tags} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} className={formInputClass} placeholder="VD: Frontend, Bug, Feature" disabled={isReadOnly} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className={formLabelClass}>Ngày bắt đầu</label>
                    {/* FIX: Explicitly type event object */}
                    <input type="date" id="startDate" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className={formInputClass} required disabled={isReadOnly} />
                </div>
                <div>
                    <label htmlFor="deadline" className={formLabelClass}>Deadline</label>
                    {/* FIX: Explicitly type event object */}
                    <input type="date" id="deadline" value={deadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)} className={formInputClass} required disabled={isReadOnly} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="priority" className={formLabelClass}>Độ ưu tiên</label>
                    {/* FIX: Explicitly type the event object 'e' to correctly access 'e.target.value'. */}
                    <select id="priority" value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as Priority)} className={formInputClass} disabled={isReadOnly}>
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="difficulty" className={formLabelClass}>Độ khó</label>
                    {/* FIX: Explicitly type the event object 'e' to correctly access 'e.target.value'. */}
                    <select id="difficulty" value={difficulty} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value as TaskDifficulty)} className={formInputClass} disabled={isReadOnly}>
                        {Object.values(TaskDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className={formLabelClass}>Trạng thái</label>
                    {/* FIX: Explicitly type the event object 'e' to correctly access 'e.target.value'. */}
                    <select id="status" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as TaskStatus)} className={formInputClass}>
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Attachments Section */}
            {!isReadOnly && (
                <div className="space-y-3 pt-3 border-t border-gray-700/50">
                    <label className={formLabelClass}>Tệp đính kèm (Google Drive)</label>
                    <div className="space-y-2">
                        {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-md">
                                <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-indigo-300 hover:underline truncate" title={att.url}>{att.name}</a>
                                <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="p-1 text-gray-400 hover:text-red-400">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* FIX: Explicitly type event object */}
                        <input type="text" value={newAttachmentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAttachmentName(e.target.value)} placeholder="Tên tệp" className={`${formInputClass} sm:flex-1`}/>
                        {/* FIX: Explicitly type event object */}
                        <input type="url" value={newAttachmentUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAttachmentUrl(e.target.value)} placeholder="URL tệp" className={`${formInputClass} sm:flex-1`}/>
                        <button type="button" onClick={handleAddAttachment} className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition flex items-center justify-center gap-1">
                            <PlusIcon className="w-5 h-5" /> <span className="sm:hidden">Thêm</span>
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">{taskToEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
            </div>
        </form>

        {taskToEdit && (
            <>
              {mailtoHref && (
                <div className="mt-4">
                  <a 
                    href={mailtoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition font-semibold"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    Gửi Email Nhắc Nhở
                  </a>
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Bình luận ({taskToEdit.comments.length})</h3>
                  <div className="space-y-4 mb-4">
                      {taskToEdit.comments.length > 0 ? [...taskToEdit.comments].reverse().map(comment => {
                          const author = employeesMap.get(comment.authorId);
                          return (
                              <div key={comment.id} className="flex gap-3 items-start">
                                  <img src={author?.avatarUrl ?? 'https://picsum.photos/seed/placeholder/100'} alt={author?.name} className="w-9 h-9 rounded-full mt-1" />
                                  <div className="bg-gray-700 rounded-lg p-3 flex-1">
                                      <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-sm text-indigo-300">{author?.name || 'Người dùng không tồn tại'}</span>
                                      <span className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString('vi-VN')}</span>
                                      </div>
                                      <p className="text-gray-200 text-sm whitespace-pre-wrap">{comment.text}</p>
                                  </div>
                              </div>
                          );
                      }) : <p className="text-gray-400 text-sm italic text-center">Chưa có bình luận nào.</p>}
                  </div>
                  <div className="space-y-2">
                       {/* FIX: Explicitly type event object */}
                       <textarea value={newComment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)} placeholder={`Bình luận với tư cách ${currentUser.name}...`} className={formInputClass} rows={2} aria-label="Nội dung bình luận"></textarea>
                      <button onClick={handleAddComment} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition font-semibold">Gửi bình luận</button>
                  </div>
              </div>
            </>
        )}
    </div>
  );
};

export default TaskForm;