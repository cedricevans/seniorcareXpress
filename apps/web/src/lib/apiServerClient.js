const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiServerClient = {
  fetch: async (url, options = {}) => {
    return await window.fetch(API_URL + url, options);
  }
};

export default apiServerClient;
export { apiServerClient };
