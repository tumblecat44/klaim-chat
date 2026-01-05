// Pricing Management
const PricingManager = {
    currentEditId: null,
    
    init() {
        // Add pricing button
        const addBtn = document.querySelector('.btn-add-pricing');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }
        
        // Modal buttons
        const saveBtn = document.querySelector('.btn-save-pricing');
        const cancelBtn = document.querySelector('.btn-cancel');
        const closeBtn = document.querySelector('.modal-close');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.savePricing());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        
        // Type toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show/hide price field
                const priceGroup = document.getElementById('price-group');
                if (e.target.dataset.type === 'paid') {
                    priceGroup.style.display = 'block';
                } else {
                    priceGroup.style.display = 'none';
                }
            });
        });
        
        // Close modal on backdrop click
        const modal = document.getElementById('pricing-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    },
    
    openModal(editId = null) {
        const modal = document.getElementById('pricing-modal');
        const modalTitle = document.getElementById('modal-title');
        
        this.currentEditId = editId;
        
        if (editId) {
            modalTitle.textContent = 'Edit Pricing';
            const data = Storage.load();
            const item = data.pricing.find(p => p.id === editId);
            if (item) {
                document.getElementById('modal-units').value = item.units;
                document.getElementById('modal-unit').value = item.unit;
                document.getElementById('modal-name').value = item.name;
                document.getElementById('modal-description').value = item.description;
                document.getElementById('modal-price').value = item.price || '';
                
                // Set type toggle
                document.querySelectorAll('.toggle-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.type === item.type) {
                        btn.classList.add('active');
                    }
                });
                
                // Show/hide price field
                const priceGroup = document.getElementById('price-group');
                priceGroup.style.display = item.type === 'paid' ? 'block' : 'none';
            }
        } else {
            modalTitle.textContent = 'Add Pricing';
            this.clearModal();
        }
        
        modal.classList.add('active');
    },
    
    closeModal() {
        const modal = document.getElementById('pricing-modal');
        modal.classList.remove('active');
        this.clearModal();
        this.currentEditId = null;
    },
    
    clearModal() {
        document.getElementById('modal-units').value = '';
        document.getElementById('modal-unit').value = '';
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-description').value = '';
        document.getElementById('modal-price').value = '';
        
        // Reset to free type
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'free') {
                btn.classList.add('active');
            }
        });
        
        document.getElementById('price-group').style.display = 'none';
    },
    
    savePricing() {
        const units = document.getElementById('modal-units').value;
        const unit = document.getElementById('modal-unit').value;
        const name = document.getElementById('modal-name').value;
        const description = document.getElementById('modal-description').value;
        const type = document.querySelector('.toggle-btn.active').dataset.type;
        const price = type === 'paid' ? parseFloat(document.getElementById('modal-price').value) || 0 : 0;
        
        if (!name) {
            alert('Please enter a name for the pricing plan');
            return;
        }
        
        const data = Storage.load();
        
        const pricingItem = {
            id: this.currentEditId || Date.now(),
            units: parseInt(units) || 0,
            unit: unit || 'credits',
            type,
            price,
            name,
            description
        };
        
        if (this.currentEditId) {
            // Update existing
            const index = data.pricing.findIndex(p => p.id === this.currentEditId);
            if (index !== -1) {
                data.pricing[index] = pricingItem;
            }
        } else {
            // Add new
            data.pricing.push(pricingItem);
        }
        
        Storage.save(data);
        this.renderPricingList();
        this.updatePreview();
        this.closeModal();
    },
    
    deletePricing(id) {
        if (!confirm('Are you sure you want to delete this pricing plan?')) return;
        
        const data = Storage.load();
        data.pricing = data.pricing.filter(p => p.id !== id);
        Storage.save(data);
        
        this.renderPricingList();
        this.updatePreview();
    },
    
    renderPricingList() {
        const container = document.getElementById('pricing-list');
        const data = Storage.load();
        
        container.innerHTML = '';
        
        data.pricing.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'pricing-item';
            div.dataset.id = item.id;
            div.draggable = true;
            
            div.innerHTML = `
                <span class="drag-handle">⋮⋮</span>
                <div class="pricing-info">
                    <div class="pricing-name">${item.name}</div>
                    <div class="pricing-type">${item.units} ${item.unit} | ${item.type === 'free' ? 'FREE' : '$' + item.price}</div>
                </div>
                <div class="pricing-actions">
                    <button class="btn-icon btn-edit" data-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${item.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
        
        // Add event listeners
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(parseInt(btn.dataset.id));
            });
        });
        
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePricing(parseInt(btn.dataset.id));
            });
        });
        
        // Initialize drag and drop
        this.initDragAndDrop();
    },
    
    initDragAndDrop() {
        const container = document.getElementById('pricing-list');
        let draggedElement = null;
        
        container.querySelectorAll('.pricing-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            });
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.saveOrder();
        });
    },
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.pricing-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    saveOrder() {
        const container = document.getElementById('pricing-list');
        const items = container.querySelectorAll('.pricing-item');
        const data = Storage.load();
        
        const newOrder = [];
        items.forEach(item => {
            const id = parseInt(item.dataset.id);
            const pricingItem = data.pricing.find(p => p.id === id);
            if (pricingItem) {
                newOrder.push(pricingItem);
            }
        });
        
        data.pricing = newOrder;
        Storage.save(data);
        this.updatePreview();
    },
    
    updatePreview() {
        const data = Storage.load();
        const previewFrame = document.getElementById('preview-frame');
        
        if (previewFrame && previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'update-pricing',
                pricing: data.pricing
            }, '*');
        }
    },
    
    loadPricing() {
        this.renderPricingList();
    }
};