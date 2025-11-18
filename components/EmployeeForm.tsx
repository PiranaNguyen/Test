import React, { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';

type EmployeeSubmitData = Omit<Employee, 'id' | 'avatarUrl'>;
type EmployeeEditData = Omit<Employee, 'avatarUrl'>;

interface EmployeeFormProps {
  onSubmit: (employee: EmployeeSubmitData | EmployeeEditData) => void;
  onCancel: () => void;
  employeeToEdit?: Employee | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, onCancel, employeeToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setEmail(employeeToEdit.email);
      setPhone(employeeToEdit.phone);
      setDob(employeeToEdit.dob);
      setRole(employeeToEdit.role);
      setPassword(''); // Không hiển thị mật khẩu cũ
    } else {
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setDob('');
      setRole(UserRole.MEMBER);
      setPassword('');
    }
  }, [employeeToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
        alert("Vui lòng nhập tên và email nhân viên.");
        return;
    }
    
    const employeeData = { name, email, phone, dob, role, password: password || undefined };
    if (employeeToEdit) {
        onSubmit({ id: employeeToEdit.id, ...employeeData });
    } else {
        if (!password) {
            alert('Vui lòng nhập mật khẩu cho nhân viên mới.');
            return;
        }
        onSubmit(employeeData);
    }
  };
  
  const formLabelClass = "block text-sm font-medium text-gray-300 mb-1";
  const formInputClass = "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={formLabelClass}>Tên nhân viên</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} required />
          </div>
          <div>
            <label htmlFor="email" className={formLabelClass}>Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass} required />
          </div>
          <div>
            <label htmlFor="phone" className={formLabelClass}>Số điện thoại</label>
            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={formInputClass} />
          </div>
          <div>
            <label htmlFor="dob" className={formLabelClass}>Ngày sinh</label>
            <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} className={formInputClass} />
          </div>
      </div>
       <div>
        <label htmlFor="role" className={formLabelClass}>Vai trò</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={formInputClass}>
            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="password" className={formLabelClass}>Mật khẩu</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={formInputClass} placeholder={employeeToEdit ? 'Để trống nếu không đổi' : 'Bắt buộc cho nhân viên mới'} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">Hủy</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition">{employeeToEdit ? 'Cập nhật' : 'Thêm mới'}</button>
      </div>
    </form>
  );
};

export default EmployeeForm;