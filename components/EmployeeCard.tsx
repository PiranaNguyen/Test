import React from 'react';
import { Employee, UserRole } from '../types';
import { PencilIcon, TrashIcon, EnvelopeIcon, PhoneIcon, CakeIcon } from './icons';

interface EmployeeCardProps {
  employee: Employee;
  currentUser: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, currentUser, onEdit, onDelete }) => {
  const canManage = currentUser.role === UserRole.ADMIN;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col border border-gray-700 hover:border-indigo-500 transition-colors duration-300 transform hover:-translate-y-1">
      <div className="p-5 flex flex-col items-center text-center">
        <img src={employee.avatarUrl} alt={employee.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700" />
        <h4 className="text-xl text-white font-bold">{employee.name}</h4>
        <p className={`px-3 py-1 mt-2 rounded-full text-xs font-semibold ${employee.role === UserRole.ADMIN ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-600/50 text-gray-300'}`}>
          {employee.role}
        </p>
      </div>
      <div className="border-t border-gray-700 p-5 space-y-3 text-sm">
        <div className="flex items-center text-gray-400">
          <EnvelopeIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500" />
          <a href={`mailto:${employee.email}`} className="hover:text-indigo-400 transition-colors">{employee.email}</a>
        </div>
        <div className="flex items-center text-gray-400">
          <PhoneIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500" />
          <span>{employee.phone}</span>
        </div>
        <div className="flex items-center text-gray-400">
          <CakeIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500" />
          <span>{new Date(employee.dob).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
      {canManage && (
        <div className="border-t border-gray-700 p-2 flex justify-end space-x-1">
          <button onClick={() => onEdit(employee)} className="text-gray-400 hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-all" aria-label={`Chỉnh sửa ${employee.name}`}>
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(employee.id)} className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-all" aria-label={`Xóa ${employee.name}`}>
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;