import { createContext, useState, useContext, useCallback } from 'react';
import api from '../utils/api';

const PlanContext = createContext(null);

export const PlanProvider = ({ children }) => {
    const [planData, setPlanData] = useState(null);

    const fetchPlanData = useCallback(async () => {
        try {
            const res = await api.get('/api/analytics/stats');
            if (res.data?.success) {
                setPlanData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch plan data:', err);
        }
    }, []);

    const value = {
        planData,
        fetchPlanData,
    };

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlan = () => useContext(PlanContext);
