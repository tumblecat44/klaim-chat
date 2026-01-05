// Color Theme Management
const ColorThemes = {
    default: {
        primary: '#4EA699',
        secondary: '#140D4F',
        text: '#1F2937',
        accent: '#FFFFFF',
        background: '#FFFFFF'
    },
    ocean: {
        primary: '#0EA5E9',
        secondary: '#075985',
        text: '#0C4A6E',
        accent: '#FFFFFF',
        background: '#F0F9FF'
    },
    sunset: {
        primary: '#F97316',
        secondary: '#DC2626',
        text: '#7C2D12',
        accent: '#FFFFFF',
        background: '#FFF7ED'
    },
    forest: {
        primary: '#16A34A',
        secondary: '#14532D',
        text: '#052E16',
        accent: '#FFFFFF',
        background: '#F0FDF4'
    },
    blackwhite: {
        primary: '#000000',
        secondary: '#525252',
        text: '#000000',
        accent: '#FFFFFF',
        background: '#F5F5F5'
    },
    midnight: {
        primary: '#1E40AF',
        secondary: '#1E293B',
        text: '#0F172A',
        accent: '#FFFFFF',
        background: '#F8FAFC'
    },
    darkocean: {
        primary: '#0891B2',
        secondary: '#164E63',
        text: '#083344',
        accent: '#FFFFFF',
        background: '#ECFEFF'
    }
};

const ColorManager = {
    init() {
        // Initialize color template selector
        const templateSelect = document.getElementById('color-template');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.applyTemplate(e.target.value);
            });
        }
        
        // Initialize individual color pickers
        const colorTypes = ['primary', 'secondary', 'text', 'accent', 'background'];
        colorTypes.forEach(type => {
            const colorInput = document.getElementById(`color-${type}`);
            const textInput = document.getElementById(`color-${type}-text`);
            
            if (colorInput && textInput) {
                // Sync color picker with text input
                colorInput.addEventListener('change', (e) => {
                    textInput.value = e.target.value;
                    this.updateColor(type, e.target.value);
                });
                
                textInput.addEventListener('input', (e) => {
                    if (this.isValidHex(e.target.value)) {
                        colorInput.value = e.target.value;
                        this.updateColor(type, e.target.value);
                    }
                });
            }
        });
    },
    
    applyTemplate(templateName) {
        const theme = ColorThemes[templateName];
        if (!theme) return;
        
        Object.entries(theme).forEach(([type, color]) => {
            const colorInput = document.getElementById(`color-${type}`);
            const textInput = document.getElementById(`color-${type}-text`);
            
            if (colorInput) colorInput.value = color;
            if (textInput) textInput.value = color;
            
            this.updateColor(type, color);
        });
        
        // Save to storage
        const data = Storage.load();
        data.colors.template = templateName;
        data.colors = { ...data.colors, ...theme };
        Storage.save(data);
    },
    
    updateColor(type, color) {
        // Update preview
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame && previewFrame.contentWindow) {
            const colors = {};
            colors[`${type}-color`] = color;
            
            previewFrame.contentWindow.postMessage({
                type: 'update-colors',
                colors: colors
            }, '*');
        }
        
        // Save to storage
        const data = Storage.load();
        data.colors[type] = color;
        Storage.save(data);
    },
    
    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    },
    
    loadColors(colors) {
        Object.entries(colors).forEach(([type, color]) => {
            if (type === 'template') {
                const templateSelect = document.getElementById('color-template');
                if (templateSelect) templateSelect.value = color;
            } else {
                const colorInput = document.getElementById(`color-${type}`);
                const textInput = document.getElementById(`color-${type}-text`);
                
                if (colorInput) colorInput.value = color;
                if (textInput) textInput.value = color;
            }
        });
        
        // Update preview with all colors
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
    }
};