import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LogOut, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
}

const COLORS = {
    high: '#ef4444',
    medium: '#eab308',
    low: '#3b82f6',
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', status: 'pending', priority: 'medium' });

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, formData);
            } else {
                await api.post('/tasks', formData);
            }
            fetchTasks();
            closeModal();
        } catch (err) {
            console.error("Failed to save task", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await api.put(`/tasks/${id}`, { status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const openModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setFormData({ title: task.title, description: task.description || '', status: task.status, priority: task.priority });
        } else {
            setEditingTask(null);
            setFormData({ title: '', description: '', status: 'pending', priority: 'medium' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const filteredTasks = tasks.filter(t => filterStatus === 'all' ? true : t.status === filterStatus);

    // Stats
    const stats = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'done').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;

        const priorityCount = tasks.reduce((acc, t) => {
            acc[t.priority] = (acc[t.priority] || 0) + 1;
            return acc;
        }, { low: 0, medium: 0, high: 0 });

        const pieData = Object.entries(priorityCount).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        return { total, done, pending, inProgress, pieData };
    }, [tasks]);

    return (
        <div className="min-h-screen bg-dark-900 text-gray-100 p-6 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 border-b border-dark-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
                </div>
                <button onClick={logout} className="flex items-center text-gray-400 hover:text-white transition-colors bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 flex flex-col justify-center">
                    <div className="text-gray-400 text-sm mb-1">Total Tasks</div>
                    <div className="text-3xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 flex flex-col justify-center">
                    <div className="text-gray-400 text-sm mb-1 flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Completed</div>
                    <div className="text-3xl font-bold text-white">{stats.done}</div>
                </div>

                {/* Chart Segment - Spans 2 columns */}
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 md:col-span-2 flex items-center">
                    <div className="w-1/2 h-32">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-500 text-sm">No priority data</div>}
                    </div>
                    <div className="w-1/2 px-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Priority Distribution</h3>
                        <div className="text-xs space-y-2">
                            {['high', 'medium', 'low'].map(p => (
                                <div key={p} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[p as keyof typeof COLORS] }}></div>
                                    <span className="capitalize text-gray-400 flex-1">{p}</span>
                                    <span className="font-medium text-white">{stats.pieData.find(d => d.name === p)?.value || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                        {['all', 'pending', 'in_progress', 'done'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${filterStatus === status ? 'bg-primary-600 text-white' : 'bg-dark-900 text-gray-400 hover:text-white border border-dark-700'}`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => openModal()} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 inline-flex items-center rounded-lg text-sm transition-colors">
                        <Plus className="w-4 h-4 mr-1" /> New Task
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 border-2 border-dashed border-dark-700 rounded-lg">No tasks found. Create one to get started!</div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-dark-900 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors group">
                                <div className="flex items-start flex-1">
                                    <div className="pt-1 mr-3">
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            className="bg-transparent text-xs border border-dark-700 rounded p-1 text-gray-400 focus:outline-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.title}</h4>
                                        {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
                                        ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {task.priority}
                                    </span>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(task)} className="text-gray-400 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-dark-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-dark-700 relative">
                        <h2 className="text-xl font-bold text-white mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
                        <form onSubmit={handleSaveTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white text-sm focus:ring-1 focus:ring-primary-500" placeholder="What needs to be done?" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white text-sm focus:ring-1 focus:ring-primary-500 h-24" placeholder="Add some details..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white text-sm">
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
                                    <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white text-sm">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded transition-colors">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
