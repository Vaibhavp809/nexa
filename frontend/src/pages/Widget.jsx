import React, { useEffect } from 'react';
import Bubble from '../components/Bubble/Bubble';
import '../index.css';

/**
 * Standalone widget page that can be embedded in an iframe
 * This page only shows the bubble, no navbar or other UI
 */
export default function Widget() {
    useEffect(() => {
        // Get API URL from query params or default
        const urlParams = new URLSearchParams(window.location.search);
        const apiUrl = urlParams.get('apiUrl') || window.location.origin.replace('/widget', '');
        
        // Store API URL for use by api.js
        if (apiUrl && !apiUrl.endsWith('/api')) {
            window.NEXA_API_URL = apiUrl + '/api';
        } else if (apiUrl) {
            window.NEXA_API_URL = apiUrl;
        }
        
        // Prevent parent page scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Listen for text selection from parent window
    useEffect(() => {
        const handleMessage = (event) => {
            // Accept messages from any origin (for cross-domain embedding)
            if (event.data && event.data.type === 'nexa-text-selected') {
                window.dispatchEvent(new CustomEvent('nexa-text-selected', { 
                    detail: { text: event.data.text } 
                }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            overflow: 'hidden',
            background: 'transparent'
        }}>
            <Bubble />
        </div>
    );
}

