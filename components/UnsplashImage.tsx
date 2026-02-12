import React, { useState, useEffect } from 'react';
import { fetchUnsplashImage, getRandomTravelImage } from '../services/unsplashService';
import { ImageIcon, Loader2 } from 'lucide-react';

interface UnsplashImageProps {
    query: string;
    className?: string;
    alt?: string;
    width?: number;
    height?: number;
}

const UnsplashImage: React.FC<UnsplashImageProps> = ({
    query,
    className = "",
    alt = "Travel Image",
    width = 800,
    height = 600
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadImage = async () => {
            setLoading(true);
            setError(false);
            try {
                const url = await fetchUnsplashImage(query);
                if (isMounted) {
                    if (url) {
                        setImageUrl(url);
                    } else {
                        // Fallback to random if no results
                        setImageUrl(getRandomTravelImage(width, height));
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(true);
                    setImageUrl(getRandomTravelImage(width, height));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (query) {
            loadImage();
        }
        return () => { isMounted = false; };
    }, [query, width, height]);

    if (loading && !imageUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl || getRandomTravelImage(width, height)}
            alt={alt}
            className={className}
            onError={(e) => {
                if (!error) {
                    setError(true);
                    e.currentTarget.src = getRandomTravelImage(width, height);
                }
            }}
        />
    );
};

export default UnsplashImage;
