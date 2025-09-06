// Apply theme immediately before React loads
(function() {
  const savedSettings = localStorage.getItem('writing-app-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }
})();