// Round Robin Contact Manager
class RoundRobinApp {
    constructor() {
        // Initialize data
        this.contacts = this.loadFromStorage('contacts') || [];
        this.groups = this.loadFromStorage('groups') || [];
        this.workflows = this.loadFromStorage('workflows') || [];
        this.salesReps = this.generateSalesReps();
        this.currentUser = 'System'; // In a real app, this would be the logged-in user
        this.currentContactId = null; // Track current contact being viewed

        // Filter state
        this.filterState = {
            search: '',
            owner: '',
            company: ''
        };

        // Initialize UI
        this.initEventListeners();
        this.populateFilterDropdowns();
        this.renderContacts();
        this.renderGroups();
        this.renderWorkflows();
    }

    // Generate 10 random sales rep names
    generateSalesReps() {
        const firstNames = ['Alex', 'Jordan', 'Morgan', 'Casey', 'Taylor', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Dakota'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        return firstNames.map((first, i) => ({
            id: `rep-${i + 1}`,
            name: `${first} ${lastNames[i]}`
        }));
    }

    // Local Storage Methods
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`roundrobin-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error loading ${key} from storage:`, e);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(`roundrobin-${key}`, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
        }
    }

    // Event Listeners
    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Modal controls
        document.querySelectorAll('.close, [data-modal]').forEach(el => {
            el.addEventListener('click', (e) => {
                const modalId = el.dataset.modal;
                if (modalId) this.closeModal(modalId);
            });
        });

        // Create buttons
        document.getElementById('add-contact-btn').addEventListener('click', () => this.openModal('contact-modal'));
        document.getElementById('add-group-btn').addEventListener('click', () => this.openModal('group-modal'));
        document.getElementById('add-workflow-btn').addEventListener('click', () => this.openModal('workflow-modal'));

        // Form submissions
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleCreateContact(e));
        document.getElementById('group-form').addEventListener('submit', (e) => this.handleCreateGroup(e));
        document.getElementById('workflow-form').addEventListener('submit', (e) => this.handleCreateWorkflow(e));
        document.getElementById('assign-workflow-form').addEventListener('submit', (e) => this.handleAssignWorkflow(e));

        // Add condition button
        document.getElementById('add-condition-btn').addEventListener('click', () => this.addCondition());

        // Workflow assignment
        document.getElementById('assign-workflow-select').addEventListener('change', (e) => this.showWorkflowPreview(e.target.value));

        // Filter controls
        document.getElementById('contact-search').addEventListener('input', (e) => {
            this.filterState.search = e.target.value;
            this.renderContacts();
        });

        document.getElementById('filter-owner').addEventListener('change', (e) => {
            this.filterState.owner = e.target.value;
            this.renderContacts();
        });

        document.getElementById('filter-company').addEventListener('change', (e) => {
            this.filterState.company = e.target.value;
            this.renderContacts();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Render sales reps in group modal
        this.renderSalesRepsSelection();
    }

    // Filter Methods
    clearFilters() {
        this.filterState = {
            search: '',
            owner: '',
            company: ''
        };
        document.getElementById('contact-search').value = '';
        document.getElementById('filter-owner').value = '';
        document.getElementById('filter-company').value = '';
        this.renderContacts();
    }

    populateFilterDropdowns() {
        // Populate owner filter
        const ownerSelect = document.getElementById('filter-owner');
        const owners = [...new Set(this.contacts.map(c => c.owner).filter(Boolean))];

        ownerSelect.innerHTML = '<option value="">All Owners</option>' +
            owners.map(ownerId => {
                const rep = this.salesReps.find(r => r.id === ownerId);
                return `<option value="${ownerId}">${rep ? rep.name : 'Unknown'}</option>`;
            }).join('');

        // Populate company filter
        const companySelect = document.getElementById('filter-company');
        const companies = [...new Set(this.contacts.map(c => c.company).filter(Boolean))];

        companySelect.innerHTML = '<option value="">All Companies</option>' +
            companies.map(company => `<option value="${company}">${company}</option>`).join('');
    }

    filterContacts() {
        return this.contacts.filter(contact => {
            // Search filter
            if (this.filterState.search) {
                const searchLower = this.filterState.search.toLowerCase();
                const matchesSearch =
                    contact.firstName.toLowerCase().includes(searchLower) ||
                    contact.lastName.toLowerCase().includes(searchLower) ||
                    contact.email.toLowerCase().includes(searchLower) ||
                    (contact.company && contact.company.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Owner filter
            if (this.filterState.owner && contact.owner !== this.filterState.owner) {
                return false;
            }

            // Company filter
            if (this.filterState.company && contact.company !== this.filterState.company) {
                return false;
            }

            return true;
        });
    }

    // Tab Switching
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    // Modal Controls
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');

        // Special handling for workflow modal
        if (modalId === 'workflow-modal') {
            this.populateWorkflowGroups();
            this.clearConditions();
            this.addCondition(); // Start with one condition
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');

        // Reset forms
        const form = modal.querySelector('form');
        if (form) form.reset();
    }

    // Contact Management
    handleCreateContact(e) {
        e.preventDefault();

        const contact = {
            id: `contact-${Date.now()}`,
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            company: document.getElementById('company').value || 'N/A',
            owner: null,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser,
            modifiedAt: new Date().toISOString(),
            modifiedBy: this.currentUser,
            workflowHistory: []
        };

        // Assign contact to owner via workflows
        this.assignContactToOwner(contact);

        this.contacts.push(contact);
        this.saveToStorage('contacts', this.contacts);
        this.populateFilterDropdowns();
        this.renderContacts();
        this.closeModal('contact-modal');
    }

    assignContactToOwner(contact) {
        // Find matching workflow
        const matchingWorkflow = this.workflows.find(workflow =>
            this.checkWorkflowConditions(contact, workflow)
        );

        if (matchingWorkflow) {
            const group = this.groups.find(g => g.id === matchingWorkflow.groupId);
            if (group) {
                contact.owner = this.getNextOwnerInGroup(group);

                // Track workflow execution
                contact.workflowHistory.push({
                    workflowId: matchingWorkflow.id,
                    workflowName: matchingWorkflow.name,
                    groupId: group.id,
                    groupName: group.name,
                    assignedTo: contact.owner,
                    executedAt: new Date().toISOString()
                });
            }
        } else {
            // If no workflow matches, use default group if exists
            const defaultGroup = this.groups.find(g => g.name === 'Default');
            if (defaultGroup) {
                contact.owner = this.getNextOwnerInGroup(defaultGroup);

                contact.workflowHistory.push({
                    workflowId: 'default',
                    workflowName: 'Default Assignment',
                    groupId: defaultGroup.id,
                    groupName: defaultGroup.name,
                    assignedTo: contact.owner,
                    executedAt: new Date().toISOString()
                });
            }
        }
    }

    checkWorkflowConditions(contact, workflow) {
        // Check if contact matches all conditions
        return workflow.conditions.every(condition => {
            const contactValue = contact[condition.field]?.toLowerCase() || '';
            const conditionValue = condition.value.toLowerCase();

            switch (condition.operator) {
                case 'equals':
                    return contactValue === conditionValue;
                case 'contains':
                    return contactValue.includes(conditionValue);
                case 'starts_with':
                    return contactValue.startsWith(conditionValue);
                case 'ends_with':
                    return contactValue.endsWith(conditionValue);
                default:
                    return false;
            }
        });
    }

    getNextOwnerInGroup(group) {
        // Round robin with weighting
        if (!group.members || group.members.length === 0) return null;

        // Get current assignment counts
        const assignmentCounts = {};
        group.members.forEach(member => {
            assignmentCounts[member.repId] = this.contacts.filter(c => c.owner === member.repId).length;
        });

        // Calculate weighted targets
        const totalWeight = group.members.reduce((sum, m) => sum + m.weight, 0);
        const totalAssigned = Object.values(assignmentCounts).reduce((sum, count) => sum + count, 0);

        // Find member who is furthest below their weighted target
        let selectedMember = null;
        let maxDeficit = -Infinity;

        group.members.forEach(member => {
            const currentCount = assignmentCounts[member.repId] || 0;
            const targetCount = (totalAssigned + 1) * (member.weight / totalWeight);
            const deficit = targetCount - currentCount;

            if (deficit > maxDeficit) {
                maxDeficit = deficit;
                selectedMember = member;
            }
        });

        return selectedMember ? selectedMember.repId : null;
    }

    renderContacts() {
        const tbody = document.getElementById('contacts-tbody');
        const filteredContacts = this.filterContacts();

        if (filteredContacts.length === 0) {
            const message = this.contacts.length === 0
                ? 'No contacts yet. Click "Create Contact" to get started.'
                : 'No contacts match your filters.';

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-text">${message}</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by most recent first
        const sortedContacts = [...filteredContacts].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        tbody.innerHTML = sortedContacts.map(contact => {
            const owner = this.salesReps.find(rep => rep.id === contact.owner);
            const ownerName = owner ? owner.name : 'Unassigned';
            const createdDate = new Date(contact.createdAt).toLocaleDateString();
            const modifiedDate = contact.modifiedAt ? new Date(contact.modifiedAt).toLocaleDateString() : 'N/A';
            const fullName = `${contact.firstName} ${contact.lastName}`;

            return `
                <tr>
                    <td><span class="clickable-name" onclick="app.showContactDetails('${contact.id}')">${fullName}</span></td>
                    <td>${contact.email}</td>
                    <td>${contact.company}</td>
                    <td>${ownerName}</td>
                    <td>${createdDate}</td>
                    <td>${modifiedDate}</td>
                </tr>
            `;
        }).join('');
    }

    showContactDetails(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        // Store current contact ID
        this.currentContactId = contactId;

        // Populate contact details
        document.getElementById('contact-details-name').textContent = `${contact.firstName} ${contact.lastName}`;
        document.getElementById('detail-first-name').textContent = contact.firstName;
        document.getElementById('detail-last-name').textContent = contact.lastName;
        document.getElementById('detail-email').textContent = contact.email;
        document.getElementById('detail-company').textContent = contact.company;

        const owner = this.salesReps.find(r => r.id === contact.owner);
        document.getElementById('detail-owner').textContent = owner ? owner.name : 'Unassigned';

        // Format dates
        const createdDate = new Date(contact.createdAt).toLocaleString();
        const modifiedDate = contact.modifiedAt ? new Date(contact.modifiedAt).toLocaleString() : 'N/A';

        document.getElementById('detail-created-at').textContent = createdDate;
        document.getElementById('detail-created-by').textContent = contact.createdBy || 'System';
        document.getElementById('detail-modified-at').textContent = modifiedDate;
        document.getElementById('detail-modified-by').textContent = contact.modifiedBy || 'N/A';

        // Render workflow history
        const workflowHistoryContainer = document.getElementById('detail-workflow-history');

        if (!contact.workflowHistory || contact.workflowHistory.length === 0) {
            workflowHistoryContainer.innerHTML = `
                <div style="text-align: center; color: #718096; padding: 20px;">
                    No workflow has been executed on this contact yet.
                </div>
            `;
        } else {
            // Sort by most recent first
            const sortedHistory = [...contact.workflowHistory].sort((a, b) =>
                new Date(b.executedAt) - new Date(a.executedAt)
            );

            workflowHistoryContainer.innerHTML = sortedHistory.map((history, index) => {
                const executedDate = new Date(history.executedAt).toLocaleString();
                const assignedRep = this.salesReps.find(r => r.id === history.assignedTo);
                const assignedName = assignedRep ? assignedRep.name : 'Unknown';
                const isMostRecent = index === 0;

                return `
                    <div class="workflow-history-item" style="${isMostRecent ? 'border-left-color: #48bb78;' : ''}">
                        <div class="workflow-history-item-header">
                            <span class="workflow-history-item-name">
                                ${history.workflowName} ${isMostRecent ? '(Most Recent)' : ''}
                            </span>
                            <span class="workflow-history-item-date">${executedDate}</span>
                        </div>
                        <div class="workflow-history-item-group">
                            Group: ${history.groupName} → Assigned to: ${assignedName}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Set up assign workflow button listener (remove old listener first)
        const assignBtn = document.getElementById('assign-workflow-btn');
        const newAssignBtn = assignBtn.cloneNode(true);
        assignBtn.parentNode.replaceChild(newAssignBtn, assignBtn);
        newAssignBtn.addEventListener('click', () => this.openAssignWorkflowModal());

        this.openModal('contact-details-modal');
    }

    // Workflow Assignment Methods
    openAssignWorkflowModal() {
        // Populate workflows dropdown
        const select = document.getElementById('assign-workflow-select');

        if (this.workflows.length === 0) {
            select.innerHTML = '<option value="">No workflows available - create one first</option>';
            select.disabled = true;
        } else {
            select.disabled = false;
            select.innerHTML = '<option value="">Choose a workflow...</option>' +
                this.workflows.map(workflow => `
                    <option value="${workflow.id}">${workflow.name}</option>
                `).join('');
        }

        // Hide preview
        document.getElementById('workflow-preview').style.display = 'none';

        this.openModal('assign-workflow-modal');
    }

    showWorkflowPreview(workflowId) {
        const preview = document.getElementById('workflow-preview');

        if (!workflowId) {
            preview.style.display = 'none';
            return;
        }

        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) return;

        const group = this.groups.find(g => g.id === workflow.groupId);
        const groupName = group ? group.name : 'Unknown Group';
        const memberCount = group ? group.members.length : 0;

        preview.innerHTML = `
            <h4>Workflow Details</h4>
            <div class="workflow-preview-item">
                <strong>Routes to:</strong> ${groupName} (${memberCount} members)
            </div>
            <div class="workflow-preview-item">
                <strong>Conditions:</strong>
            </div>
            ${workflow.conditions.map(condition => `
                <div class="workflow-preview-item" style="padding-left: 16px;">
                    • ${this.formatCondition(condition)}
                </div>
            `).join('')}
            <div class="workflow-preview-item" style="margin-top: 8px; padding: 8px; background: #fff3cd; border-radius: 4px; color: #856404;">
                ℹ️ The contact will be assigned using round robin to the next available member in this group.
            </div>
        `;
        preview.style.display = 'block';
    }

    handleAssignWorkflow(e) {
        e.preventDefault();

        const workflowId = document.getElementById('assign-workflow-select').value;
        if (!workflowId) {
            alert('Please select a workflow');
            return;
        }

        const contact = this.contacts.find(c => c.id === this.currentContactId);
        if (!contact) {
            alert('Contact not found');
            return;
        }

        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) {
            alert('Workflow not found');
            return;
        }

        const group = this.groups.find(g => g.id === workflow.groupId);
        if (!group) {
            alert('Group not found');
            return;
        }

        // Assign to next owner in group
        const newOwner = this.getNextOwnerInGroup(group);
        contact.owner = newOwner;

        // Update modified timestamp
        contact.modifiedAt = new Date().toISOString();
        contact.modifiedBy = this.currentUser;

        // Add to workflow history
        if (!contact.workflowHistory) {
            contact.workflowHistory = [];
        }

        contact.workflowHistory.push({
            workflowId: workflow.id,
            workflowName: `${workflow.name} (Manual)`,
            groupId: group.id,
            groupName: group.name,
            assignedTo: newOwner,
            executedAt: new Date().toISOString()
        });

        // Save changes
        this.saveToStorage('contacts', this.contacts);

        // Close modal and refresh contact details
        this.closeModal('assign-workflow-modal');
        this.renderContacts();
        this.populateFilterDropdowns();

        // Refresh the contact details view
        this.showContactDetails(this.currentContactId);
    }

    // Group Management
    renderSalesRepsSelection() {
        const container = document.getElementById('reps-selection');
        container.innerHTML = this.salesReps.map(rep => `
            <div class="rep-checkbox">
                <input type="checkbox" id="rep-${rep.id}" value="${rep.id}">
                <label for="rep-${rep.id}">${rep.name}</label>
            </div>
        `).join('');
    }

    handleCreateGroup(e) {
        e.preventDefault();

        const selectedReps = [];
        document.querySelectorAll('#reps-selection input:checked').forEach(checkbox => {
            selectedReps.push({
                repId: checkbox.value,
                weight: 1 // Default weight
            });
        });

        if (selectedReps.length === 0) {
            alert('Please select at least one sales rep');
            return;
        }

        const group = {
            id: `group-${Date.now()}`,
            name: document.getElementById('group-name').value,
            members: selectedReps,
            createdAt: new Date().toISOString()
        };

        this.groups.push(group);
        this.saveToStorage('groups', this.groups);
        this.renderGroups();
        this.closeModal('group-modal');
    }

    renderGroups() {
        const container = document.getElementById('groups-list');

        if (this.groups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">No round robin groups yet. Create one to start assigning contacts.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.groups.map(group => {
            const contactCount = this.contacts.filter(c =>
                group.members.some(m => m.repId === c.owner)
            ).length;

            return `
                <div class="group-card">
                    <div class="group-card-header">
                        <div>
                            <h3>${group.name}</h3>
                        </div>
                        <div class="group-card-actions">
                            <button class="btn btn-sm btn-danger" onclick="app.deleteGroup('${group.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="group-stats">
                        <div class="stat">
                            <div class="stat-label">Members</div>
                            <div class="stat-value">${group.members.length}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Contacts</div>
                            <div class="stat-value">${contactCount}</div>
                        </div>
                    </div>
                    <div class="group-members">
                        <h4>Members:</h4>
                        ${group.members.map(member => {
                            const rep = this.salesReps.find(r => r.id === member.repId);
                            return `<span class="member-tag">${rep ? rep.name : 'Unknown'}</span>`;
                        }).join('')}
                    </div>
                    <div style="margin-top: 16px;">
                        <button class="btn btn-secondary" style="width: 100%;" onclick="app.showGroupDetails('${group.id}')">
                            View Details & Adjust Weights
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showGroupDetails(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        document.getElementById('group-details-title').textContent = group.name;

        // Render members with weights
        const membersHtml = group.members.map(member => {
            const rep = this.salesReps.find(r => r.id === member.repId);
            const contactCount = this.contacts.filter(c => c.owner === member.repId).length;

            return `
                <div class="member-item" onclick="app.showRepContacts('${member.repId}')">
                    <div>
                        <div class="member-name">${rep ? rep.name : 'Unknown'}</div>
                        <div style="font-size: 12px; color: #718096;">${contactCount} contacts</div>
                    </div>
                    <div class="member-weight">
                        <label style="font-size: 13px; color: #718096;">Weight:</label>
                        <input type="number" class="weight-input" min="1" max="10" value="${member.weight}"
                               onchange="app.updateMemberWeight('${groupId}', '${member.repId}', this.value)"
                               onclick="event.stopPropagation()">
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('group-members-list').innerHTML = membersHtml;

        // Render contacts assigned to this group
        const groupContacts = this.contacts.filter(c =>
            group.members.some(m => m.repId === c.owner)
        );

        const contactsHtml = groupContacts.length > 0
            ? groupContacts.map(contact => {
                const owner = this.salesReps.find(r => r.id === contact.owner);
                return `
                    <div class="contact-item">
                        <div class="contact-item-name">${contact.firstName} ${contact.lastName}</div>
                        <div class="contact-item-email">${contact.email} • ${owner ? owner.name : 'Unassigned'}</div>
                    </div>
                `;
            }).join('')
            : '<div style="text-align: center; color: #718096; padding: 20px;">No contacts assigned yet</div>';

        document.getElementById('group-contacts-list').innerHTML = contactsHtml;

        this.openModal('group-details-modal');
    }

    updateMemberWeight(groupId, repId, newWeight) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const member = group.members.find(m => m.repId === repId);
        if (member) {
            member.weight = parseInt(newWeight) || 1;
            this.saveToStorage('groups', this.groups);
        }
    }

    showRepContacts(repId) {
        const rep = this.salesReps.find(r => r.id === repId);
        if (!rep) return;

        document.getElementById('rep-contacts-title').textContent = `${rep.name}'s Contacts`;

        const repContacts = this.contacts.filter(c => c.owner === repId);
        const tbody = document.getElementById('rep-contacts-tbody');

        if (repContacts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #718096; padding: 40px;">
                        No contacts assigned yet
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = repContacts.map(contact => {
                const createdDate = new Date(contact.createdAt).toLocaleDateString();
                return `
                    <tr>
                        <td>${contact.firstName}</td>
                        <td>${contact.lastName}</td>
                        <td>${contact.email}</td>
                        <td>${contact.company}</td>
                        <td>${createdDate}</td>
                    </tr>
                `;
            }).join('');
        }

        this.openModal('rep-contacts-modal');
    }

    deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group?')) return;

        this.groups = this.groups.filter(g => g.id !== groupId);
        this.saveToStorage('groups', this.groups);
        this.renderGroups();
    }

    // Workflow Management
    populateWorkflowGroups() {
        const select = document.getElementById('workflow-group');
        select.innerHTML = '<option value="">Select a group...</option>' +
            this.groups.map(group => `
                <option value="${group.id}">${group.name}</option>
            `).join('');
    }

    addCondition() {
        const container = document.getElementById('conditions-container');
        const conditionId = Date.now();

        const conditionHtml = `
            <div class="condition" data-condition-id="${conditionId}">
                <select class="condition-field" required>
                    <option value="">Select field...</option>
                    <option value="firstName">First Name</option>
                    <option value="lastName">Last Name</option>
                    <option value="email">Email</option>
                    <option value="company">Company</option>
                </select>
                <select class="condition-operator" required>
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="starts_with">Starts with</option>
                    <option value="ends_with">Ends with</option>
                </select>
                <input type="text" class="condition-value" placeholder="Value" required>
                <button type="button" class="btn btn-danger btn-sm" onclick="app.removeCondition(${conditionId})">Remove</button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', conditionHtml);
    }

    removeCondition(conditionId) {
        const condition = document.querySelector(`[data-condition-id="${conditionId}"]`);
        if (condition) condition.remove();
    }

    clearConditions() {
        document.getElementById('conditions-container').innerHTML = '';
    }

    handleCreateWorkflow(e) {
        e.preventDefault();

        const conditions = [];
        document.querySelectorAll('.condition').forEach(conditionEl => {
            conditions.push({
                field: conditionEl.querySelector('.condition-field').value,
                operator: conditionEl.querySelector('.condition-operator').value,
                value: conditionEl.querySelector('.condition-value').value
            });
        });

        if (conditions.length === 0) {
            alert('Please add at least one condition');
            return;
        }

        const workflow = {
            id: `workflow-${Date.now()}`,
            name: document.getElementById('workflow-name').value,
            groupId: document.getElementById('workflow-group').value,
            conditions: conditions,
            createdAt: new Date().toISOString()
        };

        this.workflows.push(workflow);
        this.saveToStorage('workflows', this.workflows);
        this.renderWorkflows();
        this.closeModal('workflow-modal');
    }

    renderWorkflows() {
        const container = document.getElementById('workflows-list');

        if (this.workflows.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚙️</div>
                    <div class="empty-state-text">No workflows yet. Create a workflow to automatically route contacts to groups.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.workflows.map(workflow => {
            const group = this.groups.find(g => g.id === workflow.groupId);
            const groupName = group ? group.name : 'Unknown Group';

            return `
                <div class="workflow-card">
                    <div class="workflow-header">
                        <h3>${workflow.name}</h3>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteWorkflow('${workflow.id}')">Delete</button>
                    </div>
                    <div class="workflow-info">
                        <div class="workflow-info-item">
                            <strong>Routes to:</strong> ${groupName}
                        </div>
                    </div>
                    <div class="workflow-conditions">
                        <h4>Conditions (ALL must match):</h4>
                        ${workflow.conditions.map(condition => `
                            <div class="condition-item">
                                • ${this.formatCondition(condition)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    formatCondition(condition) {
        const fieldNames = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            company: 'Company'
        };

        const operatorNames = {
            equals: 'equals',
            contains: 'contains',
            starts_with: 'starts with',
            ends_with: 'ends with'
        };

        return `${fieldNames[condition.field] || condition.field} ${operatorNames[condition.operator] || condition.operator} "${condition.value}"`;
    }

    deleteWorkflow(workflowId) {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        this.workflows = this.workflows.filter(w => w.id !== workflowId);
        this.saveToStorage('workflows', this.workflows);
        this.renderWorkflows();
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RoundRobinApp();
});
