import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/register', { name, email, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to register');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
            <div className="bg-dark-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-dark-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary-500/10 p-3 rounded-full mb-4">
                        <UserPlus className="w-8 h-8 text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Create an account</h2>
                    <p className="text-sm text-gray-400 mt-1">Start organizing your life today</p>
                </div>

                {error && <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500 transition-colors"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                        />
                    </div>
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
                            minLength={6}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center mt-6">
                        Sign Up
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
