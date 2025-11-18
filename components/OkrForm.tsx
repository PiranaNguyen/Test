import React, { useState, useEffect } from 'react';
import { OKR, KeyResult, Timeframe } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface OkrFormProps {
    onSubmit: (okr: Omit<OKR, 'id'>) => void;
    onCancel: () => void;
    okrToEdit?: OKR | null;
    employeeId: string;
    projectId: string;
    timeframe: Timeframe;
}

const OkrForm: React.FC<OkrFormProps> = ({ onSubmit, onCancel, okrToEdit, employeeId, projectId, timeframe }) => {
    const [objective, setObjective] = useState('');
    const [keyResults, setKeyResults] = useState<Omit<KeyResult, 'id' | 'progress'>[]>([]);

    useEffect(() => {
        if (okrToEdit) {
            setObjective(okrToEdit.objective);
            setKeyResults(okrToEdit.keyResults.map(({ id, progress, ...rest }) => rest));
        } else {
            setObjective('');
            setKeyResults([{ title: '' }]);
        }
    }, [okrToEdit]);
    
    const handleKeyResultChange = (index: number, value: string) => {
        const newKeyResults = [...keyResults];
        newKeyResults[index].title = value;
        setKeyResults(newKeyResults);
    };

    const addKeyResult = () => {
        setKeyResults([...keyResults, { title: '' }]);
    };
    
    const removeKeyResult = (index: number) => {
        if (keyResults.length > 1) {
            const newKeyResults = keyResults.filter((_, i) => i !== index);
            setKeyResults(newKeyResults);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validKeyResults = keyResults.filter(kr => kr.title.trim() !== '');
        if (!objective.trim() || validKeyResults.length === 0) {
            alert("Vui lòng nhập Mục tiêu và ít nhất một Kết quả chính.");
            return;
        }

        const finalKeyResults: KeyResult[] = validKeyResults.map((kr, index) => {
            const existingKr = okrToEdit?.keyResults.find(ekr => ekr.title === kr.title);
            return {
                id: existingKr?.id || `kr-temp-${Date.now()}-${index}`,
                title: kr.title,
                progress: existingKr?.progress || 0,
            };
        });

        onSubmit({
            objective,
            keyResults: finalKeyResults,
            employeeId,
            projectId,
            timeframe,
        });
    };
    
    const formLabelClass = "block text-sm font-medium text-gray-300 mb-1";
    const formInputClass = "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
    
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="okr-objective" className={formLabelClass}>Mục tiêu (Objective)</label>
                <input 
                    type="text" 
                    id="okr-objective" 
                    value={objective} 
                    onChange={e => setObjective(e.target.value)} 
                    className={formInputClass}
                    placeholder="Ví dụ: Cải thiện trải nghiệm người dùng trên di động"
                    required
                />
            </div>
            <div>
                <label className={formLabelClass}>Kết quả chính (Key Results)</label>
                <div className="space-y-2">
                    {keyResults.map((kr, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={kr.title}
                                onChange={e => handleKeyResultChange(index, e.target.value)}
                                className={`${formInputClass} flex-grow`}
                                placeholder={`Kết quả chính ${index + 1}`}
                            />
                            <button 
                                type="button" 
                                onClick={() => removeKeyResult(index)} 
                                disabled={keyResults.length <= 1}
                                className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    type="button" 
                    onClick={addKeyResult}
                    className="mt-2 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                    <PlusIcon className="w-4 h-4" /> Thêm kết quả chính
                </button>
            </div>
             <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">
                    {okrToEdit ? 'Cập nhật OKR' : 'Tạo OKR'}
                </button>
            </div>
        </form>
    );
};

export default OkrForm;