import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            await login(res.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
            <div className="bg-dark-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-dark-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary-500/10 p-3 rounded-full mb-4">
                        <LogIn className="w-8 h-8 text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                    <p className="text-sm text-gray-400 mt-1">Sign in to manage your tasks</p>
                </div>

                {error && <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center mt-6">
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-400">
                    Don't have an account? <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
