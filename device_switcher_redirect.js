(function() {
    // Escape hatch: if URL contains native=true or embed=true, run standalone
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('native') || urlParams.has('embed')) {
        return;
    }

    // Only redirect if this is the top-level window (not in iframe)
    if (window.self === window.top) {
        const path = window.location.href;
        // Find the relative path from the game categories
        const match = path.match(/(Just_Fun|Thinking_Math|Words_Stories)\/.+/);
        if (match) {
            const relativeGamePath = match[0];
            // All game pages are located 2 directory levels deep, so "../../wrapper.html" goes to the root
            window.location.replace('../../wrapper.html?game=' + encodeURIComponent(relativeGamePath));
        }
    }
})();
