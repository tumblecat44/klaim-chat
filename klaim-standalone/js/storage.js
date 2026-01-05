// Local Storage Management
const Storage = {
    STORAGE_KEY: 'klaimPromotion',
    
    getDefaultData() {
        return {
            general: {
                title: 'JasonCom',
                url: 'jason',
                description: ''
            },
            pricing: [
                {
                    id: Date.now(),
                    units: 10,
                    unit: 'credits',
                    type: 'free',
                    price: 0,
                    name: 'Free',
                    description: 'This is free item'
                },
                {
                    id: Date.now() + 1,
                    units: 100,
                    unit: 'credits', 
                    type: 'free',
                    price: 0,
                    name: 'Jaosn',
                    description: 'ddfdd'
                }
            ],
            expiration: {
                hasExpiration: false,
                expirationDate: ''
            },
            colors: {
                template: 'default',
                primary: '#4EA699',
                secondary: '#140D4F',
                text: '#1F2937',
                accent: '#FFFFFF',
                background: '#FFFFFF'
            },
            promotionName: '',
            linkPreview: {
                title: '',
                description: ''
            }
        };
    },
    
    load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored data:', e);
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    },
    
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};