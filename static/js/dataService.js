const dataService = {

    /* ---------------- HELPERS ---------------- */

    async request(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            credentials: 'same-origin'
        };

        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Request failed');
        }
        return res.json();
    },

    getCSRFToken() {
        return document.cookie
            .split('; ')
            .find(c => c.startsWith('csrftoken='))
            ?.split('=')[1] || '';
    },

    /* ---------------- DASHBOARD ---------------- */

    getDashboard() {
        return this.request('/api/dashboard/');
    },

    /* ---------------- PRODUCTION ---------------- */

    getProductionOrders() {
        return this.request('/api/production/');
    },

    createProductionOrder(data) {
        return this.request('/api/production/', 'POST', data);
    },

    updateProductionOrder(id, data) {
        return this.request(`/api/production/${id}/`, 'PUT', data);
    },

    deleteProductionOrder(id) {
        return this.request(`/api/production/${id}/`, 'DELETE');
    },

    /* ---------------- POWDER INVENTORY ---------------- */

    getPowders() {
        return this.request('/api/powders/');
    },

    addPowder(data) {
        return this.request('/api/powders/', 'POST', data);
    },

    updatePowder(id, data) {
        return this.request(`/api/powders/${id}/`, 'PUT', data);
    },

    deletePowder(id) {
        return this.request(`/api/powders/${id}/`, 'DELETE');
    },

    /* ---------------- QC ---------------- */

    getQCReports() {
        return this.request('/api/qc/');
    },

    addQCReport(data) {
        return this.request('/api/qc/', 'POST', data);
    },

    /* ---------------- UTILITIES ---------------- */

    getUtilitiesAnalytics() {
        return this.request('/api/utilities/analytics/');
    },

    addUtilityConsumption(data) {
        return this.request('/api/utilities/consume/', 'POST', data);
    }
};
    