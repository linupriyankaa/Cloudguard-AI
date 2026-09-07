// State and Data
const state = {
    currentView: 'dashboard',
    resources: [
        { id: 1, name: 'web-server-prod', type: 'EC2', cpu: 8, mem: 32, cost: 450, status: 'over-provisioned', utilCpu: 25, utilMem: 40, req: 150, lat: 45 },
        { id: 2, name: 'api-gateway', type: 'Fargate', cpu: 4, mem: 8, cost: 240, status: 'optimized', utilCpu: 65, utilMem: 70, req: 800, lat: 20 },
        { id: 3, name: 'db-primary', type: 'RDS', cpu: 16, mem: 64, cost: 1200, status: 'over-provisioned', utilCpu: 30, utilMem: 45, req: 300, lat: 10 },
        { id: 4, name: 'worker-node-1', type: 'EC2', cpu: 2, mem: 4, cost: 80, status: 'under-provisioned', utilCpu: 95, utilMem: 90, req: 50, lat: 150 },
        { id: 5, name: 'cache-cluster', type: 'ElastiCache', cpu: 4, mem: 16, cost: 350, status: 'optimized', utilCpu: 55, utilMem: 60, req: 2000, lat: 5 }
    ]
};

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const mobileToggle = document.getElementById('mobile-toggle');
const sidebar = document.getElementById('sidebar');

const simBtnAnalyze = document.getElementById('btn-analyze');
const simResult = document.getElementById('sim-result');
const resTitle = document.getElementById('res-title');
const resIcon = document.getElementById('res-icon');
const resRisk = document.getElementById('res-risk');
const resReason = document.getElementById('res-reason');
const resSavingsBox = document.getElementById('res-savings-box');
const resSavings = document.getElementById('res-savings');

const resourcesTbody = document.getElementById('resources-tbody');
const searchInput = document.getElementById('resource-search');
const filterSelect = document.getElementById('resource-filter');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderResourcesTable();
    initSimulator();
});

// Navigation
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.getAttribute('data-target');
            switchView(target);
            
            // Close mobile menu if open
            if(window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

function switchView(viewId) {
    // Update nav state
    navItems.forEach(item => {
        if(item.getAttribute('data-target') === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update view state
    views.forEach(view => {
        if(view.id === viewId) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

// Simulator Logic
function initSimulator() {
    simBtnAnalyze.addEventListener('click', () => {
        const cpuUtil = parseFloat(document.getElementById('sim-cpu-util').value);
        const memUtil = parseFloat(document.getElementById('sim-mem-util').value);
        const latency = parseFloat(document.getElementById('sim-latency').value);
        
        const currentCost = parseFloat(document.getElementById('sim-cost').value);
        const propCost = parseFloat(document.getElementById('sim-prop-cost').value);

        // Validation
        if(isNaN(cpuUtil) || isNaN(memUtil) || isNaN(currentCost) || isNaN(propCost)) {
            alert('Please enter valid numbers');
            return;
        }

        // Logic
        const isSafeCpu = cpuUtil <= 50;
        const isSafeMem = memUtil <= 60;
        const isLowLatency = latency <= 100;

        simResult.classList.remove('hidden', 'success', 'danger');
        resSavingsBox.classList.add('hidden');

        if (isSafeCpu && isSafeMem && isLowLatency) {
            // Recommendation: SAFE
            simResult.classList.add('success');
            resIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            resTitle.textContent = '✓ RIGHTSIZING RECOMMENDED';
            
            const savings = currentCost - propCost;
            if(savings > 0) {
                resSavingsBox.classList.remove('hidden');
                resSavings.textContent = `$${savings.toFixed(2)}`;
            }

            resRisk.textContent = 'Low';
            resRisk.className = 'res-value success-text';
            resReason.textContent = 'Current resource is over-provisioned and can be reduced safely. CPU and Memory utilization are low, and performance metrics indicate headroom for downsizing.';
        } else {
            // Recommendation: NOT SAFE
            simResult.classList.add('danger');
            resIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            resTitle.textContent = '✕ RIGHTSIZING NOT RECOMMENDED';
            
            resRisk.textContent = 'High';
            resRisk.className = 'res-value danger-text';
            
            let reason = 'High resource usage detected. Reducing resources may affect performance. ';
            if(!isSafeCpu) reason += 'CPU utilization is too high. ';
            if(!isSafeMem) reason += 'Memory utilization is too high. ';
            if(!isLowLatency) reason += 'Latency is already elevated.';
            
            resReason.textContent = reason;
        }
    });
}

// Resources Logic
function renderResourcesTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterTerm = filterSelect.value;

    const filtered = state.resources.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchTerm) || res.type.toLowerCase().includes(searchTerm);
        const matchesFilter = filterTerm === 'all' || res.status === filterTerm;
        return matchesSearch && matchesFilter;
    });

    resourcesTbody.innerHTML = '';

    filtered.forEach(res => {
        const tr = document.createElement('tr');
        
        let badgeClass = 'success';
        if(res.status === 'over-provisioned') badgeClass = 'warning';
        if(res.status === 'under-provisioned') badgeClass = 'danger';

        const statusText = res.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        tr.innerHTML = `
            <td><strong>${res.name}</strong></td>
            <td>${res.type}</td>
            <td>${res.cpu} vCPU</td>
            <td>${res.mem} GB</td>
            <td>$${res.cost}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td><button class="btn btn-outline btn-analyze-row" data-id="${res.id}">Analyze</button></td>
        `;
        resourcesTbody.appendChild(tr);
    });

    // Attach events to new buttons
    document.querySelectorAll('.btn-analyze-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            loadResourceIntoSimulator(id);
        });
    });
}

function loadResourceIntoSimulator(id) {
    const res = state.resources.find(r => r.id === id);
    if(!res) return;

    // Populate simulator fields
    document.getElementById('sim-name').value = res.name;
    document.getElementById('sim-cpu-util').value = res.utilCpu;
    document.getElementById('sim-mem-util').value = res.utilMem;
    document.getElementById('sim-req-vol').value = res.req;
    document.getElementById('sim-latency').value = res.lat;
    document.getElementById('sim-cost').value = res.cost;
    
    // Propose smaller config if over-provisioned
    document.getElementById('sim-prop-cpu').value = res.cpu > 2 ? res.cpu / 2 : 2;
    document.getElementById('sim-prop-mem').value = res.mem > 4 ? res.mem / 2 : 4;
    document.getElementById('sim-prop-cost').value = res.cost > 100 ? res.cost / 2 : res.cost;

    // Hide result box when loading new data
    simResult.classList.add('hidden');

    // Switch to simulator view
    switchView('simulator');
}

searchInput.addEventListener('input', renderResourcesTable);
filterSelect.addEventListener('change', renderResourcesTable);
