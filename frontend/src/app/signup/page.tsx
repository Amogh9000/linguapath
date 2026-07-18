'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { playClick } from '@/lib/sounds';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    playClick();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.signup({ username, email, password });
      api.setToken(res.access_token);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-6 md:p-12">
      <main className="w-full max-w-5xl bg-white rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-lg border-2 border-surface-container-highest">
        
        {/* Left Side: Mascot */}
        <div className="hidden md:flex flex-col items-center justify-center bg-surface-container-low p-12 w-1/2 border-r-2 border-surface-container-highest text-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-container rounded-full opacity-25 blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-container rounded-full opacity-25 blur-3xl"></div>
          
          <img 
            alt="LinguaPath Mascot Logo" 
            className="w-56 h-56 object-contain mb-8 z-10 drop-shadow-md hover:scale-105 transition-transform" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDelpsM3xCjFXaqy6iA5RbBdzdJXl_n7rxkWcIpUfsOjyOJMbD9i5YFOWVhrDOk6GQK2iw4MBFVb1Zt-Vzs1gR3ulQ6qfYLjLFmUSurQCKy1ULxY5rQKorh1AE8md09sRxIxha6hSsXv0PnawG3I7BlYXDHJnQcxt9il7EfllJkHpTd9R8rh-i_e2ygKCIsy31M1o-QHRVMq9HYKyOJyd5CaCOw85I4izNtjFmIB55u_NA2WG0sU8Rk"
          />
          <Link href="/">
            <h1 className="text-4xl font-black text-primary mb-2 z-10 cursor-pointer">
              LinguaPath
            </h1>
          </Link>
          <p className="text-lg font-bold text-on-surface-variant z-10 max-w-[80%] leading-relaxed">
            The free, fun, and effective way to learn a language!
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white relative">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 font-bold"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>

          <div className="text-center md:hidden mb-8 mt-8">
            <Link href="/">
              <h1 className="text-3xl font-black text-primary mb-2">LinguaPath</h1>
            </Link>
          </div>

          <h2 className="text-3xl font-black text-on-surface text-center mb-8">
            Create Account
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-xl font-bold">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4 mb-6" onSubmit={handleSubmit}>
            <div className="relative bg-surface rounded-2xl border-2 border-surface-container-highest focus-within:border-secondary transition-all">
              <input 
                className="w-full bg-transparent border-none p-4 rounded-2xl focus:outline-none font-bold text-on-surface placeholder-on-surface-variant" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                type="text"
              />
            </div>
            
            <div className="relative bg-surface rounded-2xl border-2 border-surface-container-highest focus-within:border-secondary transition-all">
              <input 
                className="w-full bg-transparent border-none p-4 rounded-2xl focus:outline-none font-bold text-on-surface placeholder-on-surface-variant" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                type="email"
              />
            </div>

            <div className="relative bg-surface rounded-2xl border-2 border-surface-container-highest focus-within:border-secondary transition-all">
              <input 
                className="w-full bg-transparent border-none p-4 rounded-2xl focus:outline-none font-bold text-on-surface placeholder-on-surface-variant" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                type="password"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-secondary text-on-secondary py-4 rounded-2xl font-black text-sm uppercase tracking-wider btn-3d-secondary mt-4 hover:brightness-110 disabled:opacity-50" 
              type="submit"
            >
              {loading ? 'Creating...' : 'Create profile'}
            </button>
          </form>

          <div className="mt-8 text-center font-bold text-on-surface">
            Already have an account? 
            <Link href="/login" className="text-secondary font-black hover:underline ml-1">
              Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
