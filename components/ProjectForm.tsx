import React, { useState, useEffect, useMemo } from 'react';
import { Project, Employee, ActivityLog } from '../types';
import { PlusIcon, TrashIcon, CheckCircleIcon, PaperClipIcon } from './icons';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id'> | Project) => void;
  onCancel: () => void;
  projectToEdit?: Project | null;
  employees: Employee[];
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel, projectToEdit, employees }) => {
  const [name, setName] = useState('');
  const [contractUrl, setContractUrl] = useState('');
  const [milestones, setMilestones] = useState<Project['milestones']>([]);
  const [attachments, setAttachments] = useState<Project['attachments']>([]);

  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  const [activeTab, setActiveTab] = useState('details');

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setContractUrl(projectToEdit.contractUrl || '');
      setMilestones(projectToEdit.milestones || []);
      setAttachments(projectToEdit.attachments || []);
    } else {
      setName('');
      setContractUrl('');
      setMilestones([]);
      setAttachments([]);
    }
  }, [projectToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên dự án.");
      return;
    }

    if (projectToEdit) {
      onSubmit({ ...projectToEdit, name, contractUrl, milestones, attachments });
    } else {
      const newProjectData: Omit<Project, 'id'> = {
        name,
        contractUrl,
        milestones,
        attachments,
        activityLog: []
      };
      onSubmit(newProjectData);
    }
  };

  const handleAddMilestone = () => {
    if (newMilestoneName.trim() && newMilestoneDate) {
        setMilestones([...milestones, { id: `ms-${Date.now()}`, name: newMilestoneName, date: newMilestoneDate, isCompleted: false }]);
        setNewMilestoneName('');
        setNewMilestoneDate('');
    }
  };

  const toggleMilestone = (id: string) => {
    setMilestones(milestones.map(ms => ms.id === id ? { ...ms, isCompleted: !ms.isCompleted } : ms));
  };
  
  const removeMilestone = (id: string) => {
     setMilestones(milestones.filter(ms => ms.id !== id));
  };

  const handleAddAttachment = () => {
    if (newAttachmentName.trim() && newAttachmentUrl.trim()) {
        try {
            new URL(newAttachmentUrl);
            setAttachments([...attachments, { id: `att-${Date.now()}`, name: newAttachmentName, url: newAttachmentUrl }]);
            setNewAttachmentName('');
            setNewAttachmentUrl('');
        } catch (_) {
            alert('Vui lòng nhập một URL hợp lệ.');
        }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };
  
  const formLabelClass = "block text-sm font-medium text-gray-300 mb-1";
  const formInputClass = "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const tabButtonClass = (tabName: string) => `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-gray-800 text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`;

  const renderActivityLog = (log: ActivityLog) => {
    const author = employeesMap.get(log.authorId);
    return (
        <div key={log.id} className="flex gap-3 items-start p-2 hover:bg-gray-700/30 rounded-md">
            <img src={author?.avatarUrl} alt={author?.name} className="w-8 h-8 rounded-full mt-1" />
            <div className="flex-1">
                <p className="text-sm text-gray-200">
                    <span className="font-bold text-indigo-300">{author?.name || 'Người dùng không xác định'}</span> {log.action} <span className="font-semibold text-white">"{log.entity.title}"</span>.
                </p>
                <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</p>
            </div>
        </div>
    );
  };
  
  if (!projectToEdit) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className={formLabelClass}>Tên dự án</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} required placeholder="Ví dụ: Ra mắt sản phẩm mới"/>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">Tạo dự án</button>
          </div>
        </form>
    );
  }

  return (
    <div className="max-h-[80vh] flex flex-col">
        <div className="border-b border-gray-700 flex-shrink-0">
            <nav className="-mb-px flex gap-4">
                <button onClick={() => setActiveTab('details')} className={tabButtonClass('details')}>Chi tiết</button>
                <button onClick={() => setActiveTab('milestones')} className={tabButtonClass('milestones')}>Cột mốc</button>
                <button onClick={() => setActiveTab('attachments')} className={tabButtonClass('attachments')}>Tệp đính kèm</button>
                <button onClick={() => setActiveTab('activity')} className={tabButtonClass('activity')}>Hoạt động</button>
            </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 -mx-4 -mb-4 space-y-4">
            {activeTab === 'details' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={formLabelClass}>Tên dự án</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} required />
                    </div>
                    <div>
                        <label htmlFor="contractUrl" className={formLabelClass}>URL Hợp đồng</label>
                        <input type="url" id="contractUrl" value={contractUrl} onChange={(e) => setContractUrl(e.target.value)} className={formInputClass} placeholder="https://docs.google.com/..." />
                    </div>
                </div>
            )}

            {activeTab === 'milestones' && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        {milestones.length > 0 ? milestones.map(ms => (
                            <div key={ms.id} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-md">
                                <button type="button" onClick={() => toggleMilestone(ms.id)}>
                                    <CheckCircleIcon className={`w-6 h-6 ${ms.isCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                                </button>
                                <span className={`flex-1 text-sm ${ms.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>{ms.name}</span>
                                <span className="text-xs bg-gray-600 px-2 py-1 rounded">{new Date(ms.date).toLocaleDateString('vi-VN')}</span>
                                <button type="button" onClick={() => removeMilestone(ms.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic text-center">Chưa có cột mốc nào.</p>}
                    </div>
                     <div className="flex gap-2 border-t border-gray-700 pt-3">
                        <input type="text" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} placeholder="Tên cột mốc" className={`${formInputClass} flex-1`}/>
                        <input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} className={`${formInputClass} w-40`}/>
                        <button type="button" onClick={handleAddMilestone} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon/></button>
                    </div>
                </div>
            )}

            {activeTab === 'attachments' && (
                 <div className="space-y-3">
                    <div className="space-y-2">
                         {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-md">
                                <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-indigo-300 hover:underline truncate" title={att.url}>{att.name}</a>
                                <button type="button" onClick={() => removeAttachment(att.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2 border-t border-gray-700 pt-3">
                        <input type="text" value={newAttachmentName} onChange={e => setNewAttachmentName(e.target.value)} placeholder="Tên tệp" className={`${formInputClass} flex-1`}/>
                        <input type="url" value={newAttachmentUrl} onChange={e => setNewAttachmentUrl(e.target.value)} placeholder="URL" className={`${formInputClass} flex-1`}/>
                        <button type="button" onClick={handleAddAttachment} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon/></button>
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="space-y-2">
                   {[...projectToEdit.activityLog].reverse().map(log => renderActivityLog(log))}
                   {projectToEdit.activityLog.length === 0 && <p className="text-sm text-gray-400 italic text-center">Chưa có hoạt động nào.</p>}
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50 sticky bottom-0 bg-gray-800 py-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">Cập nhật dự án</button>
            </div>
        </form>
    </div>
  );
};

export default ProjectForm;