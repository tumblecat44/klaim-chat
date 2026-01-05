// Preview Management
const PreviewManager = {
    init() {
        // Desktop/Mobile toggle
        const viewButtons = document.querySelectorAll('.btn-view');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const previewPanel = document.querySelector('.preview-panel');
                if (btn.dataset.view === 'mobile') {
                    previewPanel.classList.add('mobile');
                } else {
                    previewPanel.classList.remove('mobile');
                }
            });
        });
        
        // Listen for messages from preview iframe
        window.addEventListener('message', (e) => {
            if (e.data.type === 'content-change') {
                this.handleContentChange(e.data);
            }
        });
        
        // Wait for iframe to load before sending initial data
        const previewFrame = document.getElementById('preview-frame');
        previewFrame.addEventListener('load', () => {
            this.updateAll();
        });
    },
    
    handleContentChange(data) {
        // Update settings panel based on preview edits
        const stored = Storage.load();
        
        if (data.elementId === 'brand-name') {
            document.getElementById('title').value = data.value;
            stored.general.title = data.value;
        } else if (data.planIndex !== undefined) {
            // Update pricing data based on edited plan
            if (data.elementId === 'plan-name') {
                stored.pricing[data.planIndex].name = data.value;
            } else if (data.elementId === 'plan-price') {
                // Parse price from display format
                if (data.value === 'FREE') {
                    stored.pricing[data.planIndex].type = 'free';
                    stored.pricing[data.planIndex].price = 0;
                } else {
                    const price = parseFloat(data.value.replace('$', ''));
                    stored.pricing[data.planIndex].type = 'paid';
                    stored.pricing[data.planIndex].price = price;
                }
            } else if (data.elementId === 'plan-description') {
                stored.pricing[data.planIndex].description = data.value;
            }
        }
        
        Storage.save(stored);
        PricingManager.renderPricingList();
    },
    
    updateContent(elementId, value) {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'update-content',
                elementId: elementId,
                value: value
            }, '*');
        }
    },
    
    updateColors(colors) {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            const colorVars = {};
            Object.entries(colors).forEach(([type, color]) => {
                if (type !== 'template') {
                    colorVars[`${type}-color`] = color;
                }
            });
            
            previewFrame.contentWindow.postMessage({
                type: 'update-colors',
                colors: colorVars
            }, '*');
        }
    },
    
    updatePricing(pricing) {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'update-pricing',
                pricing: pricing
            }, '*');
        }
    },
    
    updateExpiration(hasExpiration) {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'toggle-expiration',
                hasExpiration: hasExpiration
            }, '*');
        }
    },
    
    updateLogo(title) {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'update-logo',
                title: title
            }, '*');
        }
    },
    
    updateAll() {
        const data = Storage.load();
        
        // Update all preview elements
        this.updateContent('brand-name', data.general.title);
        this.updateColors(data.colors);
        this.updatePricing(data.pricing);
        this.updateExpiration(data.expiration.hasExpiration);
        this.updateLogo(data.general.title);
    }
};