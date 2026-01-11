/**
 * useInfiniteScroll Hook
 * Issue #374: Implement Infinite Scroll Custom Hook for Post Feed
 * 
 * A custom hook that uses IntersectionObserver to trigger a callback
 * when the user scrolls to the bottom of a list.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * useInfiniteScroll
 * 
 * @param {Function} callback - Function to call when threshold is reached (loading more items)
 * @param {Object} options - IntersectionObserver options
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {number} options.threshold - Observer threshold (default 1.0)
 * @param {string} options.rootMargin - Observer rootMargin (default '20px')
 * @returns {Object} { lastElementRef, isFetching, setIsFetching }
 */
const useInfiniteScroll = (callback, { hasMore = true, threshold = 1.0, rootMargin = '20px' } = {}) => {
    const [isFetching, setIsFetching] = useState(false);
    const observer = useRef(null);

    const lastElementRef = useCallback(
        (node) => {
            // If currently fetching or no more items, don't observe
            if (isFetching || !hasMore) return;

            // Disconnect previous observer
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setIsFetching(true);
                    callback().finally(() => {
                        // We use finally to ensure fetching state is reset if the callback returns a promise
                        setIsFetching(false);
                    });
                }
            }, { threshold, rootMargin });

            if (node) observer.current.observe(node);
        },
        [isFetching, hasMore, callback, threshold, rootMargin]
    );

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (observer.current) observer.current.disconnect();
        }
    }, []);

    return { lastElementRef, isFetching, setIsFetching };
};

export default useInfiniteScroll;
