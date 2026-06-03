import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsVisible(window.scrollY > 300);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleClick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            onClick={handleClick}
            title="Back to Top"
            aria-label="Back to Top"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 1000,
                backgroundColor: '#00f5d4',
                color: '#000',
                border: 'none',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 245, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease',
            }}
        >
            <ArrowUp size={20} strokeWidth={2.5} />
        </button>
    );
}

export default BackToTop;