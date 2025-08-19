import React from 'react';
import { useState, useEffect } from 'react';
import { DailySchedule, AttendanceStatus, AttendanceState, SubmissionRecord } from '../types';

interface ScheduleFormProps {
  schedule: DailySchedule;
}

interface AnalysisData {
  statusCounts: Record<AttendanceStatus, number>;
  prelekResult: number;
  notes: { memberName: string; note: string }[];
}

// Defining the radio button group as a separate component to avoid re-rendering issues
const AttendanceRadioGroup: React.FC<{
  name: string;
  memberName: string;
  selectedValue: AttendanceStatus | null;
  onChange: (value: AttendanceStatus) => void;
}> = ({ name, memberName, selectedValue, onChange }) => {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {(Object.values(AttendanceStatus)).map((status) => (
        <label key={status} className="flex items-center space-x-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={`${name}-${memberName.replace(/\s/g, '-')}`}
            value={status}
            checked={selectedValue === status}
            onChange={() => onChange(status)}
            className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <span>{status}</span>
        </label>
      ))}
    </div>
  );
};


const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule }) => {
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [prelekResult, setPrelekResult] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    const initialState: AttendanceState = {};
    schedule.members.forEach((member) => {
      initialState[member] = { status: null, notes: '' };
    });
    setAttendance(initialState);
    setIsSubmitted(false); // Reset submission state if schedule changes
    setAnalysis(null);
    setPrelekResult('');
  }, [schedule]);

  const handleStatusChange = (memberName: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [memberName]: { 
        ...prev[memberName], 
        status,
        // Automatically clear notes if status is 'Hadir'
        notes: status === AttendanceStatus.Present ? '' : prev[memberName].notes,
      },
    }));
  };

  const handleNotesChange = (memberName: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [memberName]: { ...prev[memberName], notes },
    }));
  };
  
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // 1. Calculate Analysis
    const statusCounts = {
      [AttendanceStatus.Present]: 0,
      [AttendanceStatus.Excused]: 0,
      [AttendanceStatus.Sick]: 0,
      [AttendanceStatus.Absent]: 0,
    };
    const notes: { memberName: string; note: string }[] = [];

    Object.entries(attendance).forEach(([memberName, record]) => {
      if (record.status) {
        statusCounts[record.status]++;
      }
      if (record.notes.trim() !== '') {
        notes.push({ memberName, note: record.notes });
      }
    });

    const numericPrelek = Number(prelekResult) || 0;
    const analysisData: AnalysisData = {
      statusCounts,
      prelekResult: numericPrelek,
      notes,
    };
    
    setAnalysis(analysisData);
    
    // 2. Save data to localStorage
    const newSubmission: SubmissionRecord = {
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      scheduleTitle: schedule.title,
      attendance,
      prelekResult: numericPrelek,
    };

    try {
        const existingSubmissions: SubmissionRecord[] = JSON.parse(localStorage.getItem('siskamlingSubmissions') || '[]');
        const updatedSubmissions = [...existingSubmissions, newSubmission];
        localStorage.setItem('siskamlingSubmissions', JSON.stringify(updatedSubmissions));
    } catch (error) {
        console.error("Failed to save submissions to localStorage", error);
    }
    
    setIsSubmitted(true);

    // 3. Log data (for debugging)
    console.log('Data Absensi Tersimpan:', newSubmission);
  };
  
  const handleReset = () => {
    setIsSubmitted(false);
    setAnalysis(null);
    const initialState: AttendanceState = {};
    schedule.members.forEach((member) => {
      initialState[member] = { status: null, notes: '' };
    });
    setAttendance(initialState);
    setPrelekResult('');
  };

  const isFormComplete = Object.values(attendance).every(record => record.status !== null);

  if (isSubmitted && analysis) {
    return (
        <div>
            <div className="p-6 bg-green-600 dark:bg-green-800 text-white text-center">
                <h2 className="text-2xl font-bold">Analisis Absensi: {schedule.title}</h2>
                <p className="text-sm opacity-90">Absensi telah berhasil direkam.</p>
            </div>
            <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {Object.entries(analysis.statusCounts).map(([status, count]) => (
                         <div key={status} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                         </div>
                    ))}
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hasil Prelek Terkumpul</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(analysis.prelekResult)}</p>
                </div>

                {analysis.notes.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Catatan/Petugas Pengganti:</h3>
                        <ul className="list-disc list-inside space-y-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                            {analysis.notes.map(({ memberName, note }) => (
                                <li key={memberName} className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">{memberName}:</span> {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div className="mt-8 flex justify-end">
                     <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        Isi Absen Baru
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div>
        <div className="p-6 bg-indigo-600 dark:bg-indigo-800 text-white text-center">
            <h2 className="text-2xl font-bold">{schedule.title}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                    <thead className="border-b-2 border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-3 w-12 text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-300">No.</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-300">Nama Petugas</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-300">Kehadiran</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-300">Catatan/Petugas Pengganti</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {schedule.members.map((member, index) => {
                            const currentStatus = attendance[member]?.status;
                            const isNoteDisabled = currentStatus === AttendanceStatus.Present || currentStatus === null;
                            return (
                                <tr key={member} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 font-medium">{index + 1}.</td>
                                    <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">{member}</td>
                                    <td className="p-3">
                                      <AttendanceRadioGroup
                                        name="attendance-status"
                                        memberName={member}
                                        selectedValue={currentStatus || null}
                                        onChange={(status) => handleStatusChange(member, status)}
                                      />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={attendance[member]?.notes || ''}
                                            onChange={(e) => handleNotesChange(member, e.target.value)}
                                            placeholder={isNoteDisabled ? '-' : 'Tulis catatan...'}
                                            disabled={isNoteDisabled}
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-8">
              <label htmlFor="prelek" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Hasil Prelek (Rp)
              </label>
              <input
                type="number"
                id="prelek"
                value={prelekResult}
                onChange={(e) => setPrelekResult(e.target.value)}
                placeholder="Contoh: 50000"
                min="0"
                className="w-full max-w-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition"
              />
            </div>

            <div className="mt-8 flex justify-end items-center gap-4">
                 {!isFormComplete && (
                  <p className="text-right text-sm text-yellow-600 dark:text-yellow-400">
                    Harap isi semua status kehadiran.
                  </p>
                )}
                <button
                    type="submit"
                    disabled={!isFormComplete}
                    className="px-6 py-3 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
                >
                    Kirim Absensi
                </button>
            </div>
        </form>
    </div>
  );
};

export default ScheduleForm;