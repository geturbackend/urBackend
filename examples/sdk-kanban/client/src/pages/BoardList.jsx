import React, { useState, useEffect } from 'react';
import { client, getSessionToken } from '../lib/ub';
import { 
  Plus, MoreHorizontal, Layout, 
  Settings, Users, Clock, Loader2,
  FolderKanban, Search, Filter,
  ArrowRight
} from 'lucide-react';

export default function BoardList({ onSelectBoard, searchQuery }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const data = await client.db.getAll('boards', { sort: 'createdAt:desc' });
      // Handle the new paginated API response format
      setBoards(data.items || data);
    } catch (err) {
      console.error('Failed to fetch boards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const token = getSessionToken();
      const me = await client.auth.me(token);
      
      const res = await client.db.insert('boards', {
        name: newBoardName,
        ownerId: String(me._id),
        createdAt: new Date().toISOString()
      }, token);

      setBoards([res, ...boards]);
      setNewBoardName('');
    } catch (err) {
      alert('Failed to create board: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-[3px] border-black border-t-transparent animate-spin"></div>
        <p className="font-black tracking-widest text-xs uppercase">Loading space...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="text-6xl font-black text-black tracking-tighter mb-4 leading-none">PROJECTS</h1>
          <p className="text-black font-bold uppercase tracking-widest text-sm opacity-50">MANAGE YOUR TEAM'S VISUAL FLOW</p>
        </div>
        
        <form onSubmit={handleCreateBoard} className="flex gap-0">
          <input
            type="text"
            placeholder="PROJECT NAME..."
            className="bg-white border-[3px] border-black border-r-0 px-6 py-3 focus:outline-none focus:bg-black focus:text-white font-black tracking-widest text-xs w-64 transition-all"
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
          />
          <button
            disabled={creating}
            className="mono-btn bg-black text-white hover:bg-[#db2777] px-6 flex items-center gap-3 transition-colors disabled:opacity-50 h-[48px]"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>CREATE</span>
          </button>
        </form>
      </div>

      <div className="h-[2px] bg-black w-full mb-12"></div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {boards
          .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((board, idx) => {
          const colors = ['#2563eb', '#db2777', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2'];
          const accentColor = colors[idx % colors.length];
          
          return (
            <div
              key={board._id}
              onClick={() => onSelectBoard(board._id)}
              className="mono-card p-0 cursor-pointer group flex flex-col h-64 hover:border-black"
            >
              <div 
                className="h-20 w-full border-b-[2px] border-black group-hover:opacity-80 transition-opacity"
                style={{ backgroundColor: accentColor }}
              ></div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-xl font-black text-black tracking-tighter group-hover:underline decoration-[3px]">
                    {board.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-black border border-black px-1.5 py-0.5 uppercase tracking-tighter">SOFTWARE</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-black/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(board.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="w-8 h-8 border-[2px] border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(boards.items || boards).length === 0 && (
          <div className="col-span-full py-24 text-center border-[4px] border-dashed border-black">
            <FolderKanban className="w-16 h-16 text-black mx-auto mb-6" />
            <h3 className="text-3xl font-black text-black tracking-tighter">EMPTY WORKSPACE</h3>
            <p className="text-black font-bold uppercase tracking-widest text-xs mt-2 opacity-50">Create a board above to begin your journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
