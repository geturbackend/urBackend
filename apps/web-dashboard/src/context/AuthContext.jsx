import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/api/auth/me');
                if (response.data.success) {
                    setUser(response.data.data.user);
                }
            } catch (err) {
                console.error("Not authenticated:", err.message);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setUser(null);
        }
    };

    const login = (userData) => {
        setUser(userData);
    };

    const updateUser = (updater) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;
            return typeof updater === 'function' ? updater(currentUser) : updater;
        });
    };

    const value = { user, login, logout, updateUser, isAuthenticated: !!user, isLoading };


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
