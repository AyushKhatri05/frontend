// frontend/src/pages/_app.jsx
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {mounted ? <Component {...pageProps} /> : <div className="min-h-screen bg-gray-50"></div>}
            <Toaster position="top-right" />
        </>
    );
}