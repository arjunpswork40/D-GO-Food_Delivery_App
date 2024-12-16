module.exports = {
    isUrlMatch: (url, patterns) => {
        return patterns.some(pattern => {
            const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
            return regex.test(url);
        });
    },

    isExcludedUrl: (url) => {
        const excludedUrls = JSON.parse(process.env.EXCLUDE_URLS_FOR_CSRF || '["/api/*"]');
        return module.exports.isUrlMatch(url, excludedUrls);
    }
};
