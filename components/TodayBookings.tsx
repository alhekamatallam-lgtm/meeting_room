import React, { useMemo } from 'react';
import { Booking } from '../types';
import { ClockIcon, UsersIcon } from './icons/Icons';

interface TodayBookingsProps {
  bookings: Booking[];
}

// Helper functions for consistency
const formatTime = (timeString: string): string => {
    if (!timeString || typeof timeString !== 'string') {
      return '';
    }
    if (timeString.startsWith('1899-12-30T')) {
      try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
          return timeString;
        }
        return date.toLocaleTimeString('ar-SA-u-nu-arab', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.error("Could not format time:", timeString, error);
        return timeString;
      }
    }
    return timeString;
};

const parseDateTime = (dateStr?: string, timeStr?: string): Date | null => {
    if (!dateStr || !timeStr || typeof dateStr !== 'string' || typeof timeStr !== 'string') {
        return null;
    }
    try {
        let year, month, day;
        const dateParts = dateStr.split(/[-/]/);
        if (dateParts.length !== 3) { return null; }

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
            if (cleanedTimeStr.includes('T') && cleanedTimeStr.includes('Z')) {
                const d = new Date(cleanedTimeStr);
                if (!isNaN(d.getTime())) {
                    hour = d.getUTCHours();
                    minute = d.getUTCMinutes();
                } else { return null; }
            } else { return null; }
        } else {
            hour = parseInt(timeMatch[1], 10);
            minute = parseInt(timeMatch[2], 10);
            const ampm = timeMatch[3];

            if (ampm) {
                if ((/PM|م/i.test(ampm)) && hour < 12) { hour += 12; }
                if ((/AM|ص/i.test(ampm)) && hour === 12) { hour = 0; }
            }
        }
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) { return null; }
        const resultDate = new Date(year, month, day, hour, minute);
        return isNaN(resultDate.getTime()) ? null : resultDate;
    } catch (e) {
        return null;
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
};

const normalizeDate = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
        // Handle potential ISO strings with time component like 2024-05-22T00:00:00.000Z
        const datePart = dateStr.split('T')[0];

        const dateParts = datePart.split(/[-/]/);
        if (dateParts.length !== 3) return dateStr;

        if (dateParts[0].length === 4) { // YYYY-MM-DD
            return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
        } else { // DD/MM/YYYY or D/M/YYYY
            return `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
        }
    } catch {
        return dateStr;
    }
};

const TodayBookings: React.FC<TodayBookingsProps> = ({ bookings }) => {
    const groupedBookings = useMemo(() => {
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const todaysBookings = bookings
            .filter(b => normalizeDate(b['التاريخ']) === todayString)
            .sort((a, b) => {
                const dateA = parseDateTime(a['التاريخ'], a['من الساعة']);
                const dateB = parseDateTime(b['التاريخ'], b['من الساعة']);
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateA.getTime() - dateB.getTime();
            });

        const groups: { [key: string]: Booking[] } = {};
        todaysBookings.forEach(booking => {
            const room = booking['القاعة'];
            if (!groups[room]) {
                groups[room] = [];
            }
            groups[room].push(booking);
        });

        return groups;

    }, [bookings]);

    const rooms = Object.keys(groupedBookings).sort();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-primary">حجوزات اليوم</h1>
                <p className="text-lg font-semibold text-gray-500">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="mt-4 text-xl text-gray-500">لا توجد حجوزات لهذا اليوم.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
                    {rooms.map((room) => (
                        <div key={room} className="bg-white rounded-lg shadow-md flex flex-col h-full">
                            <h2 className="text-xl font-bold text-white bg-primary p-4 rounded-t-lg">{room}</h2>
                            <div className="p-4 space-y-4 flex-1">
                                {groupedBookings[room].map(booking => (
                                    <div key={booking['رقم الحجز']} className="border rounded-lg p-4 transition-shadow hover:shadow-lg bg-light-gray">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-primary">{booking['عنوان الاجتماع']}</h3>
                                                <p className="text-sm text-gray-600">{booking['الإدارة']} / {booking['اسم الموظف']}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(booking['الحالة'])}`}>
                                                {booking['الحالة']}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-sm text-text-dark">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <ClockIcon />
                                                <span className="font-mono tracking-wider">{`${formatTime(booking['من الساعة'])} - ${formatTime(booking['إلى الساعة'])}`}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UsersIcon />
                                                <span>{booking['عدد الحضور']} حضور</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TodayBookings;