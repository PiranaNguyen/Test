import React, { useState, useEffect } from 'react';
import { KPI, Employee, Timeframe } from '../types';

interface KpiFormProps {
    onSubmit: (kpi: Omit<KPI, 'id'>) => void;
    onCancel: () => void;
    kpiToEdit?: KPI | null;
    employees: Employee[];
    projectId: string;
    timeframe: Timeframe;
}

const KpiForm: React.FC<KpiFormProps> = ({ onSubmit, onCancel, kpiToEdit, employees, projectId, timeframe }) => {
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState(1);
    const [employeeId, setEmployeeId] = useState('');

    useEffect(() => {
        if (kpiToEdit) {
            setTitle(kpiToEdit.title);
            setTarget(kpiToEdit.target);
            setEmployeeId(kpiToEdit.employeeId);
        } else {
            setTitle('');
            setTarget(1);
            setEmployeeId(employees[0]?.id || '');
        }
    }, [kpiToEdit, employees]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !employeeId || target < 1) {
            alert("Vui lòng điền đầy đủ thông tin hợp lệ.");
            return;
        }
        onSubmit({
            title,
            target,
            employeeId,
            projectId,
            timeframe
        });
    };
    
    const formLabelClass = "block text-sm font-medium text-gray-300 mb-1";
    const formInputClass = "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="kpi-employee" className={formLabelClass}>Nhân viên</label>
                <select 
                    id="kpi-employee" 
                    value={employeeId} 
                    onChange={e => setEmployeeId(e.target.value)} 
                    className={formInputClass}
                    disabled={!!kpiToEdit} // Cannot change employee when editing
                >
                    <option value="" disabled>-- Chọn nhân viên --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="kpi-title" className={formLabelClass}>Tên KPI</label>
                <input 
                    type="text" 
                    id="kpi-title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className={formInputClass} 
                    placeholder="Ví dụ: Hoàn thành công việc"
                    required 
                />
            </div>
             <div>
                <label htmlFor="kpi-target" className={formLabelClass}>Mục tiêu</label>
                <input 
                    type="number" 
                    id="kpi-target" 
                    value={target} 
                    min="1"
                    onChange={e => setTarget(parseInt(e.target.value))} 
                    className={formInputClass} 
                    required 
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">
                    {kpiToEdit ? 'Cập nhật KPI' : 'Tạo KPI'}
                </button>
            </div>
        </form>
    );
};

export default KpiForm;