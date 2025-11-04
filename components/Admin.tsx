import React, { useState, useMemo } from 'react';
import { Booking, Room, Hospitality } from '../types';
import Modal from './Modal';
import BookingForm from './BookingForm';
import { EditIcon } from './icons/Icons';

interface AdminProps {
  allBookings: Booking[];
  rooms: Room[];
  hospitality: Hospitality[];
  onUpdateBooking: (booking: Booking) => Promise<void>;
  isSubmitting: boolean;
}

const formatDateWithDay = (dateString: string): string => {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
        let year, month, day;

        const dateParts = dateString.split(/[-/]/);
        if (dateParts.length !== 3) return dateString;

        if (dateParts[0].length === 4) { // YYYY-MM-DD
            year = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10) - 1; // month is 0-indexed
            day = parseInt(dateParts[2], 10);
        } else { // DD/MM/YYYY
            day = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10) - 1; // month is 0-indexed
            year = parseInt(dateParts[2], 10);
        }
        
        const date = new Date(year, month, day);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
        return new Intl.DateTimeFormat('ar-SA-u-nu-arab', options).format(date);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString;
    }
};

const Admin: React.FC<AdminProps> = ({ allBookings, rooms, hospitality, onUpdateBooking, isSubmitting }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const sortedBookings = useMemo(() => {
    // A robust date/time parser to handle various formats.
    const parseDateTime = (dateStr?: string, timeStr?: string): Date | null => {
        if (!dateStr || !timeStr) return null;
        try {
            let year, month, day;
            const dateParts = dateStr.split(/[-/]/);
            if (dateParts.length !== 3) return null;

            if (dateParts[0].length === 4) { [year, month, day] = dateParts.map(p => parseInt(p,10)); month--; } 
            else { [day, month, year] = dateParts.map(p => parseInt(p,10)); month--; }

            let hour, minute;
            const cleanedTimeStr = timeStr.replace(/[\u200F\u202B]/g, '').trim();
             const timeMatch = cleanedTimeStr.match(/(\d+):(\d+)\s*(AM|PM|م|ص)?/i);

            if (!timeMatch) {
                // Handle full ISO date string from Sheets time
                if (cleanedTimeStr.includes('T') && cleanedTimeStr.includes('Z')) {
                    const d = new Date(cleanedTimeStr);
                    if (!isNaN(d.getTime())) {
                        hour = d.getUTCHours();
                        minute = d.getUTCMinutes();
                    } else {
                         return null;
                    }
                } else {
                    return null;
                }
            } else {
                hour = parseInt(timeMatch[1], 10);
                minute = parseInt(timeMatch[2], 10);
                const ampm = timeMatch[3];

                if (ampm) {
                    if ((/PM|م/i.test(ampm)) && hour < 12) hour += 12;
                    if ((/AM|ص/i.test(ampm)) && hour === 12) hour = 0;
                }
            }
            const resultDate = new Date(year, month, day, hour, minute);
            return isNaN(resultDate.getTime()) ? null : resultDate;
        } catch { return null; }
    };

    return [...allBookings].sort((a, b) => {
      const dateA = parseDateTime(a['التاريخ'], a['من الساعة']);
      const dateB = parseDateTime(b['التاريخ'], b['من الساعة']);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    if (!searchTerm) {
      return sortedBookings;
    }
    return sortedBookings.filter(booking =>
      Object.values(booking).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedBookings, searchTerm]);

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (booking: Booking) => {
    try {
        await onUpdateBooking(booking);
        setIsModalOpen(false);
    } catch (error) {
        console.error("Save failed, modal will remain open.", error);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const bookingToUpdate = allBookings.find(b => b['رقم الحجز'] === bookingId);
    if (bookingToUpdate) {
        setUpdatingStatusId(bookingId);
        try {
            const updatedBooking = { ...bookingToUpdate, 'الحالة': newStatus };
            await onUpdateBooking(updatedBooking);
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setUpdatingStatusId(null);
        }
    }
  };

  const getStatusChipAndSelectClasses = (status: string) => {
    switch (status) {
      case 'معتمد':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'قيد الانتظار':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'مرفوض':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">إدارة جميع الحجوزات</h1>
        <input
          type="text"
          placeholder="ابحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-light-gray">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide">رقم الحجز</th>
                <th className="p-3 text-sm font-semibold tracking-wide">عنوان الاجتماع</th>
                <th className="p-3 text-sm font-semibold tracking-wide">التاريخ</th>
                <th className="p-3 text-sm font-semibold tracking-wide">القاعة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">اسم الموظف</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الإدارة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الحالة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">تعديل</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking['رقم الحجز']} className="border-b hover:bg-gray-50">
                  <td className="p-3">{booking['رقم الحجز']}</td>
                  <td className="p-3 font-semibold text-primary">{booking['عنوان الاجتماع']}</td>
                  <td className="p-3">{formatDateWithDay(booking['التاريخ'])}</td>
                  <td className="p-3">{booking['القاعة']}</td>
                  <td className="p-3">{booking['اسم الموظف']}</td>
                  <td className="p-3">{booking['الإدارة']}</td>
                  <td className="p-3">
                    <div className="relative">
                      <select
                        value={booking['الحالة']}
                        onChange={(e) => handleStatusChange(booking['رقم الحجز'], e.target.value)}
                        disabled={updatingStatusId === booking['رقم الحجز']}
                        className={`w-full p-1.5 pr-8 text-sm rounded-md appearance-none border focus:outline-none focus:ring-2 focus:ring-secondary ${getStatusChipAndSelectClasses(booking['الحالة'])}`}
                      >
                        <option value="قيد الانتظार">قيد الانتظار</option>
                        <option value="معتمد">معتمد</option>
                        <option value="مرفوض">مرفوض</option>
                      </select>
                      {updatingStatusId === booking['رقم الحجز'] && (
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                           <svg className="w-4 h-4 text-gray-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleEditBooking(booking)} className="text-secondary hover:text-blue-800 p-1">
                      <EditIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {filteredBookings.length === 0 && <p className="text-center py-8 text-gray-500">لا توجد حجوزات تطابق بحثك.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title="تعديل حجز">
          <BookingForm 
            booking={editingBooking} 
            onSave={handleSaveBooking} 
            onCancel={() => setIsModalOpen(false)} 
            rooms={rooms}
            hospitality={hospitality}
            allBookings={allBookings}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default Admin;