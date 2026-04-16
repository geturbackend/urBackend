import React, { useState, useEffect } from 'react';
import { client, getSessionToken, notifyActivity } from '../lib/ub';
import { 
  Plus, MoreHorizontal, Search, 
  Circle, Clock, CheckCircle2,
  Trash2, ArrowLeft, Star, Share2, 
  ArrowRight, Loader2
} from 'lucide-react';

const COLUMNS = [
  { id: 'Todo', title: 'TO DO', color: '#2563eb' },
  { id: 'In Progress', title: 'IN PROGRESS', color: '#db2777' },
  { id: 'Done', title: 'DONE', color: '#16a34a' },
];

export default function BoardDetail({ boardId, searchQuery, onBack }) {
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToCol, setAddingToCol] = useState(null);

  useEffect(() => {
    fetchBoardAndTasks();
  }, [boardId]);

  const fetchBoardAndTasks = async () => {
    try {
      const [boardData, taskData] = await Promise.all([
        client.db.getOne('boards', boardId),
        client.db.getAll('tasks', { filter: { boardId } })
      ]);
      setBoard(boardData);
      setTasks(taskData.items || taskData);
    } catch (err) {
      console.error('Failed to fetch board data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (status) => {
    if (!newTaskTitle.trim()) return;

    try {
      const token = getSessionToken();
      const me = await client.auth.me(token);
      
      const res = await client.db.insert('tasks', {
        title: newTaskTitle,
        status,
        boardId,
        ownerId: String(me._id),
        priority: 'Medium',
        createdAt: new Date().toISOString()
      }, token);

      setTasks([...tasks, res]);
      setNewTaskTitle('');
      setAddingToCol(null);

      notifyActivity({
        to: me.email,
        taskTitle: newTaskTitle,
        boardName: board.name,
        action: `Added to ${status}`,
        color: COLUMNS.find(c => c.id === status)?.color
      });
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = getSessionToken();
      const res = await client.db.patch('tasks', taskId, { status: newStatus }, token);
      setTasks(tasks.map(t => t._id === taskId ? res : t));

      const me = await client.auth.me(token);
      const movedTask = tasks.find(t => t._id === taskId);
      notifyActivity({
        to: me.email,
        taskTitle: movedTask.title,
        boardName: board.name,
        action: `Moved to ${newStatus}`,
        color: COLUMNS.find(c => c.id === newStatus)?.color
      });
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      const token = getSessionToken();
      await client.db.delete('tasks', taskId, token);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 translate-y-20">
      <div className="w-10 h-10 border-[4px] border-black border-t-transparent animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f9fafb]">
      {/* Board Header Section */}
      <div className="bg-white border-b-[3px] border-black p-8 px-10">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 border-[2px] border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#666666]">Projects</span>
                <span className="text-black font-black text-[10px]">/</span>
                <span className="text-black font-black text-[10px] uppercase tracking-widest">{board?.name}</span>
            </div>
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">{board?.name}</h1>
          </div>
        </div>
          {/* Unified Search header is now in TopNav */}
        <div className="flex items-center gap-4 mt-6">
            <div className="flex -space-x-3">
                <div className="w-9 h-9 border-[2px] border-black bg-[#db2777] flex items-center justify-center text-[11px] font-black text-white hover:z-10 transition-transform hover:-translate-y-1 cursor-pointer ring-4 ring-white">YP</div>
                <div className="w-9 h-9 border-[2px] border-black bg-[#2563eb] flex items-center justify-center text-[11px] font-black text-white hover:z-10 transition-transform hover:-translate-y-1 cursor-pointer ring-4 ring-white">HS</div>
                <div className="w-9 h-9 border-[2px] border-black bg-black flex items-center justify-center text-[11px] font-black text-white ring-4 ring-white">+2</div>
            </div>
            <div className="h-8 w-[2.5px] bg-black hidden sm:block"></div>
            <button className="mono-btn hover:bg-black hover:text-white py-1.5 border-[2px]">Invite</button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-10 overscroll-x-contain custom-scrollbar">
        <div className="flex items-start gap-8 h-full min-w-max">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-[340px] flex flex-col max-h-full">
              {/* Column Header */}
              <div 
                className="column-header"
                style={{ borderColor: col.color }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg tracking-tighter text-black">{col.title}</span>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-none">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
                <button 
                  onClick={() => setAddingToCol(col.id)}
                  className="w-7 h-7 border-[2px] border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards */}
              <div className="px-2 overflow-y-auto flex-1 space-y-2 mb-2 custom-scrollbar">
                {tasks
                  .filter(t => t.status === col.id)
                  .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(task => (
                  <div 
                    key={task._id}
                    className="mono-card p-5 group cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-black text-black leading-tight group-hover:underline underline-offset-4 decoration-2">{task.title}</h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 hover:text-white transition-all border border-transparent hover:border-black"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 border border-black uppercase tracking-tighter ${
                            task.priority === 'Urgent' ? 'bg-[#dc2626] text-white' :
                            task.priority === 'High' ? 'bg-[#ca8a04] text-white' :
                            task.priority === 'Medium' ? 'bg-[#2563eb] text-white' :
                            'bg-[#16a34a] text-white'
                        }`}>
                            {task.priority || 'Medium'}
                        </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-[11px] font-bold text-black/60 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between border-t border-black/10 pt-4 mt-2">
                      <div className="flex items-center gap-2">
                         <div 
                            className="w-3 h-3 border-[1.5px] border-black" 
                            style={{ backgroundColor: col.color }}
                         ></div>
                         <span className="text-[9px] font-black tracking-widest text-[#666666]">#UK-{task._id.slice(-4).toUpperCase()}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 border-[2px] border-black bg-black text-white flex items-center justify-center text-[8px] font-black">YP</div>
                         <select 
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                            className="bg-white border-[2px] border-black text-[9px] font-black px-1 py-0.5 focus:outline-none uppercase cursor-pointer hover:bg-black hover:text-white transition-colors"
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                         </select>
                      </div>
                    </div>
                  </div>
                ))}

                {addingToCol === col.id ? (
                  <div className="mono-card p-4 border-[#2563eb] border-[3px] shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
                    <textarea
                      autoFocus
                      placeholder="DESCRIBE THE TASK..."
                      className="w-full bg-transparent p-0 text-xs font-black tracking-widest text-black placeholder-black/30 focus:outline-none resize-none min-h-[80px]"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateTask(col.id);
                        }
                      }}
                    />
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-black/10">
                      <button 
                        onClick={() => setAddingToCol(null)}
                        className="text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        CANCEL
                      </button>
                      <button 
                        onClick={() => handleCreateTask(col.id)}
                        className="bg-black text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#2563eb] transition-colors"
                      >
                        ADD +
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingToCol(col.id)}
                    className="w-full py-4 border-[2px] border-dashed border-black/20 hover:border-black hover:bg-black/5 transition-all text-black/30 hover:text-black flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Add task</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="w-[340px] shrink-0">
              <button className="w-full h-14 border-[3px] border-dashed border-black/10 hover:border-black hover:bg-black/5 transition-all text-black/20 hover:text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                 <Plus className="w-5 h-5" />
                 <span>Add column</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
