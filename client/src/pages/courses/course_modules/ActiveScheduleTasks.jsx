import React, { useState } from 'react';
import { Zap, Clock, Map, Edit3, Trash2, Check, X } from 'lucide-react';

const ActiveScheduleTasks = ({ timetable, handleDeleteScheduleItem, updateScheduleInDB, isTeacher }) => {
    const [editingIdx, setEditingIdx] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    if (timetable?.length === 0) return null;

    const startEditing = (idx, item) => {
        if (!isTeacher) return;
        setEditingIdx(idx);
        setEditFormData({ ...item });
    };

    const cancelEditing = () => {
        setEditingIdx(null);
        setEditFormData({});
    };

    const saveEdit = async (idx) => {
        if (!isTeacher) return;
        const updated = [...timetable];
        updated[idx] = editFormData;
        if (await updateScheduleInDB({ schedule: updated })) {
            setEditingIdx(null);
        }
    };

    return (
        <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-white dark:border-gray-800 rounded-[2rem] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold dark:text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap size={14} className="text-primary-500"/> Temporal Node Registry
                </h3>
                <span className="text-[8px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full uppercase">{timetable.length} Active</span>
            </div>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {timetable.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-all ${editingIdx === idx && isTeacher ? 'bg-primary-50/10 border-primary-500 shadow-lg scale-[1.02]' : 'bg-white/40 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 hover:border-primary-500/30 hover:shadow-md'}`}>
                        {editingIdx === idx && isTeacher ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-bold text-gray-400 uppercase px-1">Temporal Day</p>
                                        <input type="text" value={editFormData.day} onChange={e=>setEditFormData({...editFormData, day: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[9px] font-medium uppercase outline-none focus:ring-1 ring-primary-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-bold text-gray-400 uppercase px-1">Phase Time</p>
                                        <input type="text" value={editFormData.time} onChange={e=>setEditFormData({...editFormData, time: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[9px] font-medium uppercase outline-none focus:ring-1 ring-primary-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-bold text-gray-400 uppercase px-1">Sector Code</p>
                                        <input type="text" value={editFormData.room} onChange={e=>setEditFormData({...editFormData, room: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[9px] font-medium uppercase outline-none focus:ring-1 ring-primary-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[7px] font-bold text-gray-400 uppercase px-1">Protocol Cluster</p>
                                        <input type="text" value={editFormData.activity} onChange={e=>setEditFormData({...editFormData, activity: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[9px] font-medium uppercase outline-none focus:ring-1 ring-primary-500" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={()=>saveEdit(idx)} className="flex-1 py-2 bg-primary-600 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-primary-700 shadow-md flex items-center justify-center gap-2">
                                        <Check size={12}/> Confirm Update
                                    </button>
                                    <button onClick={cancelEditing} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <X size={14}/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-[9px] font-bold text-primary-600 shadow-inner uppercase shrink-0 border border-gray-50 dark:border-gray-800">
                                        <span>{item.day?.slice(0, 3) || 'NOD'}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-bold dark:text-gray-100 uppercase truncate tracking-tight group-hover:text-primary-600 transition-colors">{item.activity}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[8px] font-medium text-gray-400 uppercase flex items-center gap-1"><Clock size={10}/> {item.time}</span>
                                            <span className="text-[8px] font-medium text-gray-400 uppercase flex items-center gap-1"><Map size={10}/> {item.room}</span>
                                        </div>
                                    </div>
                                </div>
                                {isTeacher && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => startEditing(idx, item)}
                                            className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                                            title="Edit Node"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteScheduleItem(idx)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                            title="Purge Node"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveScheduleTasks;
