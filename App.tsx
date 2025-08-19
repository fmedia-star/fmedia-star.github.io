import React from 'react';
import { useState, useEffect } from 'react';
import { SISKAMLING_SCHEDULE } from './constants';
import ScheduleForm from './components/ScheduleForm';
import AttendanceRecap from './components/AttendanceRecap';
import { DailySchedule } from './types';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'form' | 'recap'>('form');

  useEffect(() => {
    const timer = setInterval(() => {
      // This is mainly for cases where the app is left open past midnight
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const currentDayIndex = currentDate.getDay();
  // The attendance form for a patrol (e.g., Tuesday night patrol) should be displayed on the following day (Wednesday).
  // So, if today is Wednesday (day index 3), we need to show the schedule for Tuesday (day index 2).
  // The formula (currentDayIndex + 6) % 7 correctly finds the index of the previous day, handling the wrap-around for Sunday.
  const scheduleForDayIndex = (currentDayIndex + 6) % 7;
  const todaySchedule: DailySchedule | undefined = SISKAMLING_SCHEDULE.find(
    (schedule) => schedule.dayIndex === scheduleForDayIndex
  );

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentDate);

  const navButtonClasses = (buttonView: 'form' | 'recap') => 
    `px-4 py-3 text-sm font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 rounded-t-lg ${
      view === buttonView
        ? 'border-b-4 border-indigo-500 text-indigo-600 dark:text-indigo-400'
        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center p-4 font-sans">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Absensi Siskamling Blok H Tanjung Residence
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{formattedDate}</p>
        </header>
        
        <div className="flex justify-center mb-0 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setView('form')} className={navButtonClasses('form')}>
            Isi Absensi
          </button>
          <button onClick={() => setView('recap')} className={navButtonClasses('recap')}>
            Rekap & Analisis
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl overflow-hidden">
          {view === 'form' ? (
            todaySchedule ? (
              <ScheduleForm schedule={todaySchedule} />
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold mb-2">Jadwal Tidak Ditemukan</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tidak ada jadwal siskamling yang terdaftar untuk hari ini.
                </p>
              </div>
            )
          ) : (
             <AttendanceRecap />
          )}
        </div>
        <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Dibuat dengan ❤️ untuk keamanan bersama.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
