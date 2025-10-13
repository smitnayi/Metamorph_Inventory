// static/js/dataService.js
const dataService = {
    // Store utilities data in localStorage for persistence
    getStoredUtilities() {
        try {
            return JSON.parse(localStorage.getItem('metamorph_utilities') || '[]');
        } catch {
            return [];
        }
    },

    setStoredUtilities(data) {
        localStorage.setItem('metamorph_utilities', JSON.stringify(data));
    },

    // Dashboard Data
    async updateDashboardData() {
        try {
            const utilities = this.getStoredUtilities();
            const recentData = utilities.slice(-7); // Last 7 days
            
            // Calculate totals for last 7 days
            const totals = recentData.reduce((acc, day) => {
                acc.gas += day.gas_consumption || 0;
                acc.electricity += day.electricity_usage || 0;
                acc.water += day.water_usage || 0;
                acc.powder += day.powder_consumption || 0;
                return acc;
            }, { gas: 0, electricity: 0, water: 0, powder: 0 });

            return {
                overview: {
                    totalOrders: 24,
                    completedOrders: 12,
                    inProgress: 8,
                    pending: 4,
                    efficiency: 87,
                    powderStock: {
                        status: 'Critical',
                        belowThreshold: 3
                    },
                    stockLevels: {
                        current: 2450,
                        unit: 'kg',
                        dailyChange: '+2.5%'
                    },
                    qcPassRate: {
                        current: 94.5,
                        unit: '%',
                        dailyChange: '+1.2%'
                    }
                },
                utilities: {
                    gas: {
                        current: totals.gas,
                        unit: 'm³',
                        dailyChange: '+2%'
                    },
                    electricity: {
                        current: totals.electricity,
                        unit: 'kWh',
                        dailyChange: '-1%'
                    },
                    water: {
                        current: totals.water,
                        unit: 'm³',
                        dailyChange: '+0.5%'
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Return fallback data
            return {
                overview: {
                    totalOrders: 0,
                    completedOrders: 0,
                    inProgress: 0,
                    pending: 0,
                    efficiency: 0,
                    powderStock: { status: 'Loading...', belowThreshold: 0 },
                    stockLevels: { current: 0, unit: 'kg', dailyChange: '+0%' },
                    qcPassRate: { current: 0, unit: '%', dailyChange: '+0%' }
                },
                utilities: {
                    gas: { current: 0, unit: 'm³', dailyChange: '+0%' },
                    electricity: { current: 0, unit: 'kWh', dailyChange: '+0%' },
                    water: { current: 0, unit: 'm³', dailyChange: '+0%' }
                }
            };
        }
    },

    // Production Orders
    async getProductionOrders() {
        try {
            // Try to get from localStorage first, then fallback to mock data
            const stored = localStorage.getItem('metamorph_production_orders');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Mock data
            return [
                {
                    id: 1,
                    order_id: "PO-001",
                    product_name: "Steel Beam A25",
                    production_line: "Line 1",
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    quantity: 500,
                    status: "in_progress"
                }
            ];
        } catch (error) {
            console.error('Error fetching production orders:', error);
            return [];
        }
    },

    async saveProductionOrder(orderData) {
        try {
            const orders = await this.getProductionOrders();
            if (orderData.id) {
                // Update existing
                const index = orders.findIndex(o => o.id === orderData.id);
                if (index !== -1) {
                    orders[index] = { ...orderData };
                }
            } else {
                // Add new
                const newOrder = {
                    ...orderData,
                    id: Date.now(),
                    created_at: new Date().toISOString()
                };
                orders.push(newOrder);
            }
            
            localStorage.setItem('metamorph_production_orders', JSON.stringify(orders));
            return { success: true, id: orderData.id || Date.now() };
        } catch (error) {
            console.error('Error saving production order:', error);
            throw error;
        }
    },

    async deleteProductionOrder(orderId) {
        try {
            const orders = await this.getProductionOrders();
            const filtered = orders.filter(order => order.id !== orderId);
            localStorage.setItem('metamorph_production_orders', JSON.stringify(filtered));
            return { success: true };
        } catch (error) {
            console.error('Error deleting production order:', error);
            throw error;
        }
    },

    // Powder Inventory
    async getPowders() {
        try {
            const stored = localStorage.getItem('metamorph_powders');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Mock data
            return [
                {
                    id: 1,
                    name: "Matte Black TGIC",
                    sku: "P-10245",
                    current_stock: 52,
                    min_level: 20
                }
            ];
        } catch (error) {
            console.error('Error fetching powders:', error);
            return [];
        }
    },

    async savePowder(powderData) {
        try {
            const powders = await this.getPowders();
            if (powderData.id) {
                const index = powders.findIndex(p => p.id === powderData.id);
                if (index !== -1) {
                    powders[index] = { ...powderData };
                }
            } else {
                const newPowder = {
                    ...powderData,
                    id: Date.now()
                };
                powders.push(newPowder);
            }
            
            localStorage.setItem('metamorph_powders', JSON.stringify(powders));
            return { success: true, id: powderData.id || Date.now() };
        } catch (error) {
            console.error('Error saving powder:', error);
            throw error;
        }
    },

    async deletePowder(powderId) {
        try {
            const powders = await this.getPowders();
            const filtered = powders.filter(powder => powder.id !== powderId);
            localStorage.setItem('metamorph_powders', JSON.stringify(filtered));
            return { success: true };
        } catch (error) {
            console.error('Error deleting powder:', error);
            throw error;
        }
    },

    // Utilities Data with proper time-series
    async getUtilitiesData(timePeriod = '7d') {
        try {
            let utilities = this.getStoredUtilities();
            
            // If no data, create some sample data
            if (utilities.length === 0) {
                utilities = this.generateSampleData();
                this.setStoredUtilities(utilities);
            }

            // Filter by time period
            const now = new Date();
            let filteredData = [];

            if (timePeriod === '7d') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredData = utilities.filter(day => new Date(day.date) >= sevenDaysAgo);
            } else if (timePeriod === '30d') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredData = utilities.filter(day => new Date(day.date) >= thirtyDaysAgo);
            }

            // Ensure we have exactly 7 or 30 data points for consistent charts
            const daysNeeded = timePeriod === '7d' ? 7 : 30;
            while (filteredData.length < daysNeeded) {
                const emptyDay = {
                    date: new Date(now.getTime() - (daysNeeded - filteredData.length) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    total_gas: 0,
                    total_electricity: 0,
                    total_water: 0,
                    total_powder: 0
                };
                filteredData.unshift(emptyDay);
            }

            // Sort by date and take only the needed days
            filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
            return filteredData.slice(-daysNeeded);

        } catch (error) {
            console.error('Error fetching utilities data:', error);
            return [];
        }
    },

    // Generate sample data for demonstration
    generateSampleData() {
        const data = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                date: date.toISOString().split('T')[0],
                total_gas: Math.floor(Math.random() * 100) + 200, // 200-300 m³
                total_electricity: Math.floor(Math.random() * 500) + 1500, // 1500-2000 kWh
                total_water: Math.floor(Math.random() * 20) + 80, // 80-100 m³
                total_powder: Math.floor(Math.random() * 10) + 5 // 5-15 kg
            });
        }
        
        return data;
    },

    async getMonthlyUtilities() {
        try {
            const utilities = this.getStoredUtilities();
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const thisMonthData = utilities.filter(day => {
                const date = new Date(day.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
            
            const lastMonthData = utilities.filter(day => {
                const date = new Date(day.date);
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            });

            const sumData = (data) => data.reduce((acc, day) => ({
                electricity: acc.electricity + (day.total_electricity || 0),
                gas: acc.gas + (day.total_gas || 0),
                water: acc.water + (day.total_water || 0),
                powder: acc.powder + (day.total_powder || 0)
            }), { electricity: 0, gas: 0, water: 0, powder: 0 });

            return {
                this_month: sumData(thisMonthData),
                last_month: sumData(lastMonthData)
            };
        } catch (error) {
            console.error('Error fetching monthly utilities:', error);
            return {
                this_month: { electricity: 0, gas: 0, water: 0, powder: 0 },
                last_month: { electricity: 0, gas: 0, water: 0, powder: 0 }
            };
        }
    },

    async saveConsumption(consumptionData) {
        try {
            let utilities = this.getStoredUtilities();
            
            // Check if entry already exists for this date
            const existingIndex = utilities.findIndex(entry => entry.date === consumptionData.date);
            
            if (existingIndex !== -1) {
                // Update existing entry
                utilities[existingIndex] = {
                    ...utilities[existingIndex],
                    total_gas: consumptionData.gas_consumption,
                    total_electricity: consumptionData.electricity_usage,
                    total_water: consumptionData.water_usage,
                    total_powder: consumptionData.powder_consumption,
                    powder_type: consumptionData.powder_type
                };
            } else {
                // Add new entry
                const newEntry = {
                    date: consumptionData.date,
                    total_gas: consumptionData.gas_consumption,
                    total_electricity: consumptionData.electricity_usage,
                    total_water: consumptionData.water_usage,
                    total_powder: consumptionData.powder_consumption,
                    powder_type: consumptionData.powder_type,
                    created_at: new Date().toISOString()
                };
                utilities.push(newEntry);
            }
            
            // Sort by date and save
            utilities.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.setStoredUtilities(utilities);
            
            return { success: true };
        } catch (error) {
            console.error('Error saving consumption data:', error);
            return { success: false, error: error.message };
        }
    },

    async getOrderUtilities(orderId) {
        try {
            const orders = await this.getProductionOrders();
            const order = orders.find(o => o.order_id === orderId);
            return order || {
                electricity_used: 0,
                gas_used: 0,
                water_used: 0
            };
        } catch (error) {
            console.error('Error fetching order utilities:', error);
            throw error;
        }
    },

    async updateOrderUtilities(orderId, utilitiesData) {
        try {
            console.log('Updating utilities for order:', orderId, utilitiesData);
            return { success: true };
        } catch (error) {
            console.error('Error updating order utilities:', error);
            throw error;
        }
    }
};

// Make it available globally
window.dataService = dataService;