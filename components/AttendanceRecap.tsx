import React, { useState, useEffect, useMemo } from 'react';
import { SubmissionRecord, AttendanceStatus } from '../types';
import { SISKAMLING_SCHEDULE } from '../constants';

const AttendanceRecap: React.FC = () => {
    const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        try {
            const storedData = localStorage.getItem('siskamlingSubmissions');
            if (storedData) {
                const parsedData: SubmissionRecord[] = JSON.parse(storedData);
                // Sort by most recent first
                parsedData.sort((a, b) => b.id - a.id);
                setSubmissions(parsedData);
            }
        } catch (error) {
            console.error("Failed to load or parse submissions from localStorage", error);
        }
    }, []);

    const filteredSubmissions = useMemo(() => {
        if (filter === 'all') {
            return submissions;
        }
        return submissions.filter(s => s.scheduleTitle === filter);
    }, [filter, submissions]);
    
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatSubmissionDate = (isoString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short',
        }).format(new Date(isoString));
    };

    const getStatusCounts = (submission: SubmissionRecord): Record<AttendanceStatus, number> => {
        const counts = {
            [AttendanceStatus.Present]: 0,
            [AttendanceStatus.Excused]: 0,
            [AttendanceStatus.Sick]: 0,
            [AttendanceStatus.Absent]: 0,
        };
        Object.values(submission.attendance).forEach(record => {
            if (record.status) {
                counts[record.status]++;
            }
        });
        return counts;
    };
    
    const getNotes = (submission: SubmissionRecord): {memberName: string, note: string}[] => {
        return Object.entries(submission.attendance)
            .filter(([_, record]) => record.notes.trim() !== '')
            .map(([memberName, record]) => ({ memberName, note: record.notes }));
    }

    return (
        <div>
            <div className="p-6 bg-indigo-600 dark:bg-indigo-800 text-white text-center">
                <h2 className="text-2xl font-bold">Rekapitulasi & Analisis Absensi</h2>
            </div>
            <div className="p-6 md:p-8">
                <div className="mb-6">
                    <label htmlFor="schedule-filter" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Filter Berdasarkan Jadwal:
                    </label>
                    <select
                        id="schedule-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                    >
                        <option value="all">Semua Jadwal</option>
                        {SISKAMLING_SCHEDULE.map(schedule => (
                            <option key={schedule.title} value={schedule.title}>
                                {schedule.title}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="space-y-6">
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map(submission => {
                            const statusCounts = getStatusCounts(submission);
                            const notes = getNotes(submission);
                            return (
                                <div key={submission.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-400">{submission.scheduleTitle}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatSubmissionDate(submission.submittedAt)}</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                            {Object.entries(statusCounts).map(([status, count]) => (
                                                 <div key={status} className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">{status}</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                                                 </div>
                                            ))}
                                            <div className="col-span-2 md:col-span-1 bg-green-100 dark:bg-green-900/50 p-3 rounded-lg flex flex-col justify-center">
                                                <p className="text-xs text-green-800 dark:text-green-300 uppercase">Prelek</p>
                                                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatRupiah(submission.prelekResult)}</p>
                                            </div>
                                        </div>
                                        {notes.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Catatan:</h4>
                                                <ul className="list-disc list-inside text-sm space-y-1">
                                                    {notes.map(({ memberName, note }) => (
                                                        <li key={memberName} className="text-gray-700 dark:text-gray-300">
                                                            <span className="font-semibold">{memberName}:</span> {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h12.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V19a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Data Tidak Ditemukan</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Belum ada data absensi yang tersimpan untuk jadwal ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceRecap;
