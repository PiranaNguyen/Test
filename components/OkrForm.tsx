
import React, { useState, useEffect } from 'react';
import { OKR, KeyResult, Timeframe } from '../types';
import { PlusIcon, TrashIcon, CheckBadgeIcon } from './icons';

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
            // Load existing KRs without ID/Progress for editing text, preserve ID on submit
            setKeyResults(okrToEdit.keyResults.map(({ title }) => ({ title })));
        } else {
            setObjective('');
            setKeyResults([{ title: '' }, { title: '' }]); // Default 2 empty KRs
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
        // Filter out empty KRs
        const validKeyResults = keyResults.filter(kr => kr.title.trim() !== '');
        
        if (!objective.trim()) {
            alert("Vui lòng nhập Mục tiêu (Objective).");
            return;
        }
        
        if (validKeyResults.length === 0) {
             alert("Vui lòng nhập ít nhất một Kết quả chính (Key Result).");
             return;
        }

        // Reconstruct Key Results preserving IDs and Progress if editing
        const finalKeyResults: KeyResult[] = validKeyResults.map((kr, index) => {
            // Try to match with existing KRs to keep progress/ID
            // This is a simple matching by index if editing, or create new if new
            let existingKr: KeyResult | undefined;
            if (okrToEdit && okrToEdit.keyResults[index]) {
                 // If we are editing, we try to map back to original ID if index matches
                 // Note: This is a simplification. Real apps might track IDs in the form state.
                 existingKr = okrToEdit.keyResults[index]; 
            }

            return {
                id: existingKr?.id || `kr-${Date.now()}-${index}`,
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
         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="okr-objective" className="block text-base font-bold text-white mb-2">Mục tiêu (Objective)</label>
                <p className="text-xs text-gray-400 mb-2">Mục tiêu đầy tham vọng, định tính cần đạt được.</p>
                <input 
                    type="text" 
                    id="okr-objective" 
                    value={objective} 
                    onChange={e => setObjective(e.target.value)} 
                    className={`${formInputClass} text-lg font-semibold`}
                    placeholder="VD: Trở thành ứng dụng quản lý hàng đầu thị trường"
                    required
                />
            </div>
            
            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5"/> Kết quả chính (Key Results)
                </label>
                <p className="text-xs text-gray-400 mb-3">Các kết quả định lượng để đo lường việc đạt được mục tiêu.</p>
                
                <div className="space-y-3">
                    {keyResults.map((kr, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in-up">
                            <span className="text-gray-500 pt-2 text-xs font-mono">{index + 1}.</span>
                            <input 
                                type="text"
                                value={kr.title}
                                onChange={e => handleKeyResultChange(index, e.target.value)}
                                className={`${formInputClass} flex-grow text-sm`}
                                placeholder={`Kết quả chính #${index + 1}`}
                            />
                            <button 
                                type="button" 
                                onClick={() => removeKeyResult(index)} 
                                title="Xóa kết quả này"
                                disabled={keyResults.length <= 1}
                                className="mt-1 p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    type="button" 
                    onClick={addKeyResult}
                    className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded hover:bg-indigo-900/20"
                >
                    <PlusIcon className="w-4 h-4" /> Thêm kết quả chính
                </button>
            </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition font-semibold shadow-lg shadow-indigo-500/20">
                    {okrToEdit ? 'Lưu Thay Đổi' : 'Tạo OKR'}
                </button>
            </div>
        </form>
    );
};

export default OkrForm;
