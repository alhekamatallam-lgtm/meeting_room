import { ApiData, Booking } from '../types';

// Updated API endpoint as per user request
const API_URL = 'https://script.google.com/macros/s/AKfycbyusT6ugeXJxNCB_Lf1GaHIQVZMhnwuYSAn41lgC3Z0gvl6apLCMxrQ98JSjV_0UBJmPQ/exec';

export const fetchData = async (): Promise<ApiData> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as ApiData;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
};

// Function to add a new booking
export const addBooking = async (newBookingData: Omit<Booking, 'رقم الحجز'>): Promise<any> => {
  try {
    // Using 'no-cors' mode to prevent CORS errors when posting to Google Apps Script.
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      // Updated body structure for doPost as per user request
      body: JSON.stringify({
        sheet: 'Bookings',
        data: newBookingData,
      }),
    });

    return { success: true, message: "Request sent successfully." };
  } catch (error) {
    console.error("Failed to add booking:", error);
    throw error;
  }
};

// Function to update a full booking record
export const updateBooking = async (updatedBookingData: Booking): Promise<any> => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      // The backend can infer it's an update if 'رقم الحجز' exists in the data.
      body: JSON.stringify({
        sheet: 'Bookings',
        data: updatedBookingData,
      }),
    });
    return { success: true, message: "Update request sent successfully." };
  } catch (error) {
    console.error("Failed to update booking:", error);
    throw error;
  }
};
