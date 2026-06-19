import { useEffect, useRef, useState } from 'react';

const DEFAULT_ROOT_MARGIN = '200px 0px';
const DEFAULT_THRESHOLD = 0;

export function useInView({
    rootMargin = DEFAULT_ROOT_MARGIN,
    threshold = DEFAULT_THRESHOLD,
} = {}) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, { rootMargin, threshold });

        observer.observe(node);
        return () => observer.disconnect();
    }, [rootMargin, threshold]);

    return [ref, inView];
}
