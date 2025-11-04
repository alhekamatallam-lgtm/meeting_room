import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Room, Hospitality } from '../types';
import Modal from './Modal';
import BookingForm from './BookingForm';
import { PlusIcon, EditIcon } from './icons/Icons';

interface BookingsProps {
  initialBookings: Booking[];
  rooms: Room[];
  hospitality: Hospitality[];
  isSubmitting: boolean;
  onAddBooking: (booking: Omit<Booking, 'رقم الحجز'>) => Promise<void>;
  onUpdateBooking: (booking: Booking) => Promise<void>;
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

const formatTime = (timeString: string): string => {
    if (!timeString || typeof timeString !== 'string') {
      return '';
    }
    // This handles the specific format from Google Sheets: 1899-12-30T...
    if (timeString.startsWith('1899-12-30T')) {
      try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
          return timeString; // Return original if it's not a valid date
        }
        // Format to a locale-specific time string, e.g., "٥:٠٠ م"
        return date.toLocaleTimeString('ar-SA-u-nu-arab', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.error("Could not format time:", timeString, error);
        return timeString; // Fallback
      }
    }
    // Return the string as is if it doesn't match the specific problematic format
    return timeString;
};

const Bookings: React.FC<BookingsProps> = ({ initialBookings, rooms, hospitality, onAddBooking, onUpdateBooking, isSubmitting }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);


  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    // A highly robust date/time parser to handle various formats from the database.
    const parseDateTime = (dateStr?: string, timeStr?: string): Date | null => {
        if (!dateStr || !timeStr || typeof dateStr !== 'string' || typeof timeStr !== 'string') {
            return null;
        }

        try {
            let year, month, day;

            const dateParts = dateStr.split(/[-/]/);
            if (dateParts.length !== 3) {
                console.warn('Invalid date parts:', dateStr);
                return null;
            }

            if (dateParts[0].length === 4) { // YYYY-MM-DD
                year = parseInt(dateParts[0], 10);
                month = parseInt(dateParts[1], 10) - 1;
                day = parseInt(dateParts[2], 10);
            } else { // DD/MM/YYYY
                day = parseInt(dateParts[0], 10);
                month = parseInt(dateParts[1], 10) - 1;
                year = parseInt(dateParts[2], 10);
            }

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
                         console.warn('Invalid time parts:', timeStr);
                         return null;
                    }
                } else {
                    console.warn('Invalid time parts:', timeStr);
                    return null;
                }
            } else {
                hour = parseInt(timeMatch[1], 10);
                minute = parseInt(timeMatch[2], 10);
                const ampm = timeMatch[3];

                if (ampm) {
                    if ((/PM|م/i.test(ampm)) && hour < 12) {
                        hour += 12;
                    }
                    if ((/AM|ص/i.test(ampm)) && hour === 12) { // Handle 12 AM (midnight)
                        hour = 0;
                    }
                }
            }
            
            if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
                console.warn('Could not parse numbers from date/time:', { dateStr, timeStr });
                return null;
            }
            
            const resultDate = new Date(year, month, day, hour, minute);

            if (isNaN(resultDate.getTime())) {
                console.warn('Constructed date is invalid:', { year, month, day, hour, minute });
                return null;
            }
            
            return resultDate;
        } catch (e) {
            console.error("Error during date/time parsing:", { dateStr, timeStr }, e);
            return null;
        }
    };

    bookings.forEach(booking => {
      const meetingEndDate = parseDateTime(booking['التاريخ'], booking['إلى الساعة']);
      if (!meetingEndDate) {
          return;
      }
      
      if (meetingEndDate >= now) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });
    
    upcoming.sort((a, b) => {
        const dateA = parseDateTime(a['التاريخ'], a['من الساعة']);
        const dateB = parseDateTime(b['التاريخ'], b['من الساعة']);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
    });

    past.sort((a, b) => {
        const dateA = parseDateTime(a['التاريخ'], a['من الساعة']);
        const dateB = parseDateTime(b['التاريخ'], b['من الساعة']);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  const handleAddBooking = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (booking: Booking) => {
    try {
      if (editingBooking) {
        await onUpdateBooking(booking);
        setIsModalOpen(false);
      } else {
        const { 'رقم الحجز': _, ...newBookingData } = booking;
        await onAddBooking(newBookingData);
        setIsModalOpen(false); // Only close modal on success
      }
    } catch (error) {
      // Error is handled by a toast in App.tsx. Catching it here prevents the modal from closing.
      console.error("Save failed, modal will remain open.");
    }
  };
  
  const getStatusChip = (status: string) => {
    switch (status) {
        case 'معتمد':
            return 'bg-green-100 text-green-800';
        case 'قيد الانتظار':
            return 'bg-yellow-100 text-yellow-800';
        case 'مرفوض':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
  }

  const renderBookingRow = (booking: Booking) => (
    <tr key={booking['رقم الحجز']} className="border-b hover:bg-gray-50">
      <td className="p-3">{booking['رقم الحجز']}</td>
      <td className="p-3 font-semibold text-primary">{booking['عنوان الاجتماع']}</td>
      <td className="p-3">{formatDateWithDay(booking['التاريخ'])}</td>
      <td className="p-3">{`${formatTime(booking['من الساعة'])} - ${formatTime(booking['إلى الساعة'])}`}</td>
      <td className="p-3">{booking['القاعة']}</td>
      <td className="p-3">{booking['الإدارة']}</td>
      <td className="p-3">{booking['اسم الموظف']}</td>
      <td className="p-3">
        <span className={`px-2 py-1 text-sm rounded-full ${booking['نوع الاجتماع'] === 'خارجي' ? 'bg-secondary text-white' : 'bg-blue-100 text-primary'}`}>
          {booking['نوع الاجتماع']}
        </span>
      </td>
      <td className="p-3">
        <span className={`px-2 py-1 text-sm rounded-full ${getStatusChip(booking['الحالة'])}`}>
            {booking['الحالة']}
        </span>
      </td>
      <td className="p-3">
        <button onClick={() => handleEditBooking(booking)} className="text-secondary hover:text-blue-800 p-1">
          <EditIcon />
        </button>
      </td>
    </tr>
  );

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">إدارة الحجوزات</h1>
        <button onClick={handleAddBooking} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-900 transition">
          <PlusIcon />
          <span>إضافة حجز جديد</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button onClick={() => setActiveTab('upcoming')} className={`py-4 px-1 border-b-2 font-semibold ${activeTab === 'upcoming' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              الاجتماعات القادمة ({upcomingBookings.length})
            </button>
            <button onClick={() => setActiveTab('past')} className={`py-4 px-1 border-b-2 font-semibold ${activeTab === 'past' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              الاجتماعات الماضية ({pastBookings.length})
            </button>
          </nav>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-right">
            <thead className="bg-light-gray">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide">رقم الحجز</th>
                <th className="p-3 text-sm font-semibold tracking-wide">عنوان الاجتماع</th>
                <th className="p-3 text-sm font-semibold tracking-wide">التاريخ</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الوقت</th>
                <th className="p-3 text-sm font-semibold tracking-wide">القاعة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الإدارة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">اسم الموظف</th>
                <th className="p-3 text-sm font-semibold tracking-wide">النوع</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الحالة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {displayedBookings.map(renderBookingRow)}
            </tbody>
          </table>
            {displayedBookings.length === 0 && <p className="text-center py-8 text-gray-500">لا توجد حجوزات لعرضها.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title={editingBooking ? 'تعديل حجز' : 'إضافة حجز جديد'}>
          <BookingForm 
            booking={editingBooking} 
            onSave={handleSaveBooking} 
            onCancel={() => setIsModalOpen(false)} 
            rooms={rooms}
            hospitality={hospitality}
            allBookings={bookings}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default Bookings;