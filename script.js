// State and Data
const state = {
    resources: [
        { 
            id: 1, name: 'web-server-prod', type: 'EC2', cpu: 8, mem: 32, cost: 450, status: 'over-provisioned', 
            telemetry: {
                normal: { cpu: 25, mem: 40, req: 150, lat: 45, avail: 99.99 },
                burst: { cpu: 88, mem: 85, req: 950, lat: 180, avail: 99.90 },
                idle: { cpu: 5, mem: 15, req: 20, lat: 20, avail: 100.0 }
            }
        },
        { 
            id: 2, name: 'api-gateway', type: 'Fargate', cpu: 4, mem: 8, cost: 240, status: 'optimized', 
            telemetry: {
                normal: { cpu: 65, mem: 70, req: 800, lat: 20, avail: 99.99 },
                burst: { cpu: 92, mem: 88, req: 2500, lat: 150, avail: 99.95 },
                idle: { cpu: 15, mem: 25, req: 100, lat: 10, avail: 100.0 }
            }
        },
        { 
            id: 3, name: 'db-primary', type: 'RDS', cpu: 16, mem: 64, cost: 1200, status: 'over-provisioned', 
            telemetry: {
                normal: { cpu: 30, mem: 45, req: 300, lat: 10, avail: 99.99 },
                burst: { cpu: 75, mem: 70, req: 900, lat: 45, avail: 99.99 },
                idle: { cpu: 10, mem: 20, req: 50, lat: 5, avail: 100.0 }
            }
        },
        { 
            id: 4, name: 'worker-node-1', type: 'EC2', cpu: 2, mem: 4, cost: 80, status: 'under-provisioned', 
            telemetry: {
                normal: { cpu: 95, mem: 90, req: 50, lat: 150, avail: 99.90 },
                burst: { cpu: 100, mem: 98, req: 120, lat: 500, avail: 98.50 },
                idle: { cpu: 40, mem: 45, req: 10, lat: 40, avail: 99.99 }
            }
        },
        { 
            id: 5, name: 'cache-cluster', type: 'ElastiCache', cpu: 4, mem: 16, cost: 350, status: 'optimized', 
            telemetry: {
                normal: { cpu: 55, mem: 60, req: 2000, lat: 5, avail: 99.99 },
                burst: { cpu: 90, mem: 85, req: 5000, lat: 25, avail: 99.95 },
                idle: { cpu: 10, mem: 15, req: 200, lat: 2, avail: 100.0 }
            }
        }
    ],
    selectedResource: null
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
const simPattern = document.getElementById('sim-pattern');
const simRole = document.getElementById('sim-role');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderResourcesTable();
    initSimulator();

    // Event listener for usage pattern change
    simPattern.addEventListener('change', () => {
        updateTelemetryFields();
    });
});

function updateTelemetryFields() {
    if (!state.selectedResource) return;
    const pattern = simPattern.value;
    const tel = state.selectedResource.telemetry[pattern];
    
    document.getElementById('sim-cpu-util').value = tel.cpu;
    document.getElementById('sim-mem-util').value = tel.mem;
    document.getElementById('sim-req-vol').value = tel.req;
    document.getElementById('sim-latency').value = tel.lat;
    document.getElementById('sim-avail').value = tel.avail;
    simResult.classList.add('hidden'); // hide result on pattern change
}

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
        if (!state.selectedResource) {
            alert('Please select a resource first.');
            return;
        }

        const role = simRole.value;
        const pattern = simPattern.value;
        const cpuUtil = parseFloat(document.getElementById('sim-cpu-util').value);
        const memUtil = parseFloat(document.getElementById('sim-mem-util').value);
        const currentCost = parseFloat(document.getElementById('sim-cost').value);
        
        // Ensure we handle the actual proposed config
        const propCpu = parseFloat(document.getElementById('sim-prop-cpu').value);
        const propMem = parseFloat(document.getElementById('sim-prop-mem').value);
        const propCost = parseFloat(document.getElementById('sim-prop-cost').value);

        simResult.classList.remove('hidden', 'success', 'danger');
        resSavingsBox.classList.add('hidden');

        // Projected utilization after rightsizing (very rough heuristic)
        // If we halve the CPU, utilization doubles
        const origCpu = state.selectedResource.cpu;
        const origMem = state.selectedResource.mem;
        
        const projectedCpuUtil = cpuUtil * (origCpu / propCpu);
        const projectedMemUtil = memUtil * (origMem / propMem);
        const savings = currentCost - propCost;

        let isSafe = true;
        let risk = 'Low';
        let reason = '';
        
        // Multi-role policy engine
        if (role === 'admin') {
            // Lab Administrator: Strict performance enforcement, especially during burst
            if (pattern === 'burst') {
                if (projectedCpuUtil > 80 || projectedMemUtil > 85) {
                    isSafe = false;
                    risk = 'Critical';
                    reason = `SLA Violation: Downsizing during lab burst will cause resource saturation. Projected CPU would hit ${projectedCpuUtil.toFixed(1)}% and Memory ${projectedMemUtil.toFixed(1)}%. This will cause latency spikes exceeding 400ms during peak student lab hours.`;
                }
            } else {
                if (projectedCpuUtil > 90 || projectedMemUtil > 90) {
                    isSafe = false;
                    risk = 'High';
                    reason = `Downsizing will push utilization to critical levels (CPU: ${projectedCpuUtil.toFixed(1)}%). Performance degradation expected.`;
                }
            }
        } else if (role === 'finance') {
            // Finance Manager: Aggressive cost savings. More tolerant of high utilization unless it's catastrophic.
            if (savings <= 0) {
                isSafe = false;
                risk = 'None';
                reason = 'No cost savings achieved with this configuration.';
            } else if (projectedCpuUtil > 98 || projectedMemUtil > 98) {
                isSafe = false;
                risk = 'Very High';
                reason = `System Failure Risk: Even with aggressive cost optimization, downsizing will cause 100% saturation and complete outage during ${pattern} usage.`;
            } else {
                if (projectedCpuUtil > 85) {
                    risk = 'Moderate';
                    reason = 'Aggressive rightsizing applied to maximize savings. Minor performance degradation accepted as per policy.';
                } else {
                    risk = 'Low';
                    reason = 'Safe to rightsize. Good balance of savings and headroom.';
                }
            }
        }

        if (isSafe) {
            simResult.classList.add('success');
            resIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            resTitle.textContent = '✓ RIGHTSIZING RECOMMENDED';
            
            if(savings > 0) {
                resSavingsBox.classList.remove('hidden');
                resSavings.textContent = `$${savings.toFixed(2)}`;
            }
            resRisk.textContent = risk;
            resRisk.className = 'res-value success-text';
            resReason.textContent = reason || 'Current resource is over-provisioned and can be reduced safely.';
        } else {
            simResult.classList.add('danger');
            resIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            resTitle.textContent = '✕ RIGHTSIZING NOT RECOMMENDED';
            
            resRisk.textContent = risk;
            resRisk.className = 'res-value danger-text';
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

    state.selectedResource = res;

    // Populate simulator fields
    document.getElementById('sim-name').value = res.name;
    document.getElementById('sim-cost').value = res.cost;
    
    // Propose smaller config if over-provisioned
    document.getElementById('sim-prop-cpu').value = res.cpu > 2 ? res.cpu / 2 : 2;
    document.getElementById('sim-prop-mem').value = res.mem > 4 ? res.mem / 2 : 4;
    document.getElementById('sim-prop-cost').value = res.cost > 100 ? res.cost / 2 : res.cost;

    // Trigger telemetry update for current pattern
    updateTelemetryFields();

    // Hide result box when loading new data
    simResult.classList.add('hidden');

    // Switch to simulator view
    switchView('simulator');
}

searchInput.addEventListener('input', renderResourcesTable);
filterSelect.addEventListener('change', renderResourcesTable);
