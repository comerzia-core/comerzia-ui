import { useState, useEffect } from 'react';

export const useShake = (shakeKey?: number) => {
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (shakeKey && shakeKey > 0) {
            setIsShaking(true);
            // El tiempo debe coincidir con la duración de tu animación en Tailwind
            const timer = setTimeout(() => setIsShaking(false), 500); 
            return () => clearTimeout(timer);
        }
    }, [shakeKey]);

    return isShaking;
};