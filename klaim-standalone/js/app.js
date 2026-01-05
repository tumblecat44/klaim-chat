// Main Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Load saved data
    const data = Storage.load();
    
    // Initialize all modules
    initializeSections();
    initializeGeneralSection(data.general);
    initializeExpiration(data.expiration);
    initializeLinkPreview(data.linkPreview);
    initializePromotionName(data.promotionName);
    
    // Initialize managers
    ColorManager.init();
    PricingManager.init();
    PreviewManager.init();
    
    // Load saved data into UI
    ColorManager.loadColors(data.colors);
    PricingManager.loadPricing();
    
    // Initialize footer buttons
    initializeFooterButtons();
});

function initializeSections() {
    // Collapsible sections
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.dataset.toggle;
            const content = document.getElementById(`${section}-content`);
            
            if (content) {
                header.classList.toggle('collapsed');
                content.classList.toggle('hidden');
                
                // Update Lucide icon
                const icon = header.querySelector('svg');
                if (icon) {
                    lucide.createIcons();
                }
            }
        });
    });
}

function initializeGeneralSection(generalData) {
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const descriptionInput = document.getElementById('description');
    
    // Load saved values
    if (titleInput) titleInput.value = generalData.title || '';
    if (urlInput) urlInput.value = generalData.url || '';
    if (descriptionInput) descriptionInput.value = generalData.description || '';
    
    // Add event listeners
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.general.title = e.target.value;
            Storage.save(data);
            PreviewManager.updateContent('brand-name', e.target.value);
            PreviewManager.updateLogo(e.target.value);
        });
    }
    
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.general.url = e.target.value;
            Storage.save(data);
        });
    }
    
    if (descriptionInput) {
        descriptionInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.general.description = e.target.value;
            Storage.save(data);
        });
    }
}

function initializeExpiration(expirationData) {
    const hasExpirationCheck = document.getElementById('has-expiration');
    const expirationDateGroup = document.getElementById('expiration-date-group');
    const expirationDateInput = document.getElementById('expiration-date');
    
    // Load saved values
    if (hasExpirationCheck) {
        hasExpirationCheck.checked = expirationData.hasExpiration || false;
        
        if (expirationDateGroup) {
            expirationDateGroup.style.display = hasExpirationCheck.checked ? 'block' : 'none';
        }
    }
    
    if (expirationDateInput && expirationData.expirationDate) {
        expirationDateInput.value = expirationData.expirationDate;
    }
    
    // Add event listeners
    if (hasExpirationCheck) {
        hasExpirationCheck.addEventListener('change', (e) => {
            const data = Storage.load();
            data.expiration.hasExpiration = e.target.checked;
            Storage.save(data);
            
            if (expirationDateGroup) {
                expirationDateGroup.style.display = e.target.checked ? 'block' : 'none';
            }
            
            PreviewManager.updateExpiration(e.target.checked);
        });
    }
    
    if (expirationDateInput) {
        expirationDateInput.addEventListener('change', (e) => {
            const data = Storage.load();
            data.expiration.expirationDate = e.target.value;
            Storage.save(data);
        });
    }
}

function initializeLinkPreview(linkPreviewData) {
    const linkTitleInput = document.getElementById('link-title');
    const linkDescriptionInput = document.getElementById('link-description');
    const generateBtn = document.querySelector('.btn-generate-preview');
    
    // Load saved values
    if (linkTitleInput) linkTitleInput.value = linkPreviewData.title || '';
    if (linkDescriptionInput) linkDescriptionInput.value = linkPreviewData.description || '';
    
    // Add event listeners
    if (linkTitleInput) {
        linkTitleInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.linkPreview.title = e.target.value;
            Storage.save(data);
        });
    }
    
    if (linkDescriptionInput) {
        linkDescriptionInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.linkPreview.description = e.target.value;
            Storage.save(data);
        });
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            // Mock functionality - would generate preview image
            alert('Preview image generation (mock functionality)');
        });
    }
}

function initializePromotionName(promotionName) {
    const promotionNameInput = document.getElementById('promotion-name');
    
    if (promotionNameInput) {
        promotionNameInput.value = promotionName || '';
        
        promotionNameInput.addEventListener('input', (e) => {
            const data = Storage.load();
            data.promotionName = e.target.value;
            Storage.save(data);
        });
    }
}

function initializeFooterButtons() {
    const saveBtn = document.querySelector('.btn-save');
    const publishBtn = document.querySelector('.btn-publish');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const data = Storage.load();
            console.log('Saving draft...', data);
            alert('Draft saved (mock functionality)');
        });
    }
    
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const data = Storage.load();
            console.log('Publishing...', data);
            alert('Published successfully (mock functionality)');
        });
    }
}