import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Room, Hospitality } from '../types';

interface BookingFormProps {
  booking: Booking | null;
  rooms: Room[];
  hospitality: Hospitality[];
  allBookings: Booking[];
  isSubmitting?: boolean;
  onSave: (booking: Booking) => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ booking, rooms, hospitality, allBookings, isSubmitting, onSave, onCancel }) => {
  const getInitialData = () => ({
    'رقم الحجز': '',
    'اسم الموظف': '',
    'الإدارة': '',
    'عنوان الاجتماع': '',
    'نوع الاجتماع': 'داخلي' as 'داخلي' | 'خارجي',
    'التاريخ': new Date().toISOString().split('T')[0],
    'من الساعة': '',
    'إلى الساعة': '',
    'عدد الحضور': 1,
    'القاعة': rooms[0]?.['اسم القاعة'] || '',
    'الحالة': 'قيد الانتظار' as 'قيد الانتظار' | 'معتمد',
    'الضيافة': '',
    'الملاحظات': '',
  });

  const [formData, setFormData] = useState(getInitialData());

  const employeeNames = useMemo(() => [...new Set(allBookings.map(b => b['اسم الموظف']))], [allBookings]);
  const departments = useMemo(() => [...new Set(allBookings.map(b => b['الإدارة']))], [allBookings]);

  useEffect(() => {
    if (booking) {
      setFormData({
        ...getInitialData(),
        ...booking
      });
    } else {
        setFormData(getInitialData());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, rooms]);

  useEffect(() => {
    const suggested = hospitality.find(h => h['نوع الاجتماع'] === formData['نوع الاجتماع']);
    if (suggested) {
      setFormData(prev => ({ ...prev, 'الضيافة': suggested['نوع الضيافة'] }));
    } else {
      setFormData(prev => ({ ...prev, 'الضيافة': '' }));
    }
  }, [formData['نوع الاجتماع'], hospitality]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'عدد الحضور' ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, 'رقم الحجز': booking?.['رقم الحجز'] || '' });
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">عنوان الاجتماع</label>
          <input type="text" name="عنوان الاجتماع" value={formData['عنوان الاجتماع']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">اسم الموظف</label>
          <input list="employee-names" type="text" name="اسم الموظف" value={formData['اسم الموظف']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          <datalist id="employee-names">
            {employeeNames.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">الإدارة</label>
          <input list="departments" type="text" name="الإدارة" value={formData['الإدارة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
           <datalist id="departments">
            {departments.map(dept => <option key={dept} value={dept} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">التاريخ</label>
          <input type="date" name="التاريخ" value={formData['التاريخ']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min={today} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">القاعة</label>
          <select name="القاعة" value={formData['القاعة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            {rooms.map(r => <option key={r['اسم القاعة']} value={r['اسم القاعة']}>{r['اسم القاعة']}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">من الساعة</label>
          <input type="time" name="من الساعة" value={formData['من الساعة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">إلى الساعة</label>
          <input type="time" name="إلى الساعة" value={formData['إلى الساعة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">نوع الاجتماع</label>
          <select name="نوع الاجتماع" value={formData['نوع الاجتماع']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            <option value="داخلي">داخلي</option>
            <option value="خارجي">خارجي</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">عدد الحضور</label>
          <input type="number" name="عدد الحضور" value={formData['عدد الحضور']} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">الضيافة المقترحة</label>
            <input type="text" name="الضيافة" value={formData['الضيافة']} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">الملاحظات</label>
          <textarea name="الملاحظات" value={formData['الملاحظات']} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
          إلغاء
        </button>
        <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-900 disabled:bg-blue-800 disabled:cursor-not-allowed">
          {isSubmitting ? 'جار الحفظ...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;