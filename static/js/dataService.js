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

    /* ---------------- DASHBOARD CORE ---------------- */

    updateDashboardData() {
        // Calls the combined dashboard data endpoint
        return this.request('/dashboard/data/');
    },

    getOperatorData() {
        return this.request('/api/operator-data/');
    },

    getAdminMetrics() {
        return this.request('/api/admin-metrics/');
    },

    /* ---------------- ACTIONS ---------------- */

    updateProductionStatus(taskId, status) {
        return this.request('/api/update-production/', 'POST', { taskId, status });
    },

    submitUtilityReading(type, value) {
        // dashboard.html calls with (type, value), backend expects specific fields
        const payload = {};
        if (type === 'gas') payload.gas_consumption = value;
        if (type === 'electricity') payload.electricity_usage = value;
        if (type === 'water') payload.water_usage = value;

        // Use the generic submit endpoint
        return this.request('/api/submit-utility/', 'POST', payload);
    },

    performSystemAction(action) {
        return this.request('/api/system-action/', 'POST', { action });
    },

    /* ---------------- LEGACY / SPECIFIC (Keep if needed) ---------------- */

    getProductionOrders() {
        return this.request('/api/production/');
    },

    getPowders() {
        return this.request('/api/powders/');
    },

    getQCReports() {
        return this.request('/api/qc/');
    }
};
