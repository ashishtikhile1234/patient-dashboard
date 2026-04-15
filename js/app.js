/**
 * Coalition Technologies — Patient Dashboard
 * FED Skills Test
 *
 * Fetches data from the Patient Data API and populates the UI for Jessica Taylor.
 * Authentication uses Basic Auth with btoa() — credentials are NOT hardcoded as encoded strings.
 */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────
const API_URL       = 'https://fedskillstest.coalitiontechnologies.workers.dev';
const TARGET_PATIENT = 'Jessica Taylor';
const CHART_MONTHS   = 6; // number of months to show on BP chart

// ─── API AUTH ─────────────────────────────────────────────────
function getAuthHeader() {
  const username = 'coalition';
  const password = 'skills-test';
  return 'Basic ' + btoa(username + ':' + password);
}

// ─── FETCH PATIENT DATA ───────────────────────────────────────
async function fetchPatients() {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader()
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ─── UI STATE HELPERS ─────────────────────────────────────────
function showLoading()       { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading()       { document.getElementById('loading-overlay').classList.add('hidden'); }
function showApp()           { document.getElementById('app').classList.remove('hidden'); }

function showError(message) {
  hideLoading();
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-state').classList.remove('hidden');
}

// ─── LEVEL → ARROW & CLASS ───────────────────────────────────
function getLevelArrow(level) {
  if (!level) return { arrow: '', cls: '' };
  const l = level.toLowerCase();
  if (l.includes('higher')) return { arrow: '▲', cls: 'arrow-up' };
  if (l.includes('lower'))  return { arrow: '▼', cls: 'arrow-down' };
  return { arrow: '', cls: 'arrow-normal' };
}

// ─── STATUS → BADGE CLASS ─────────────────────────────────────
function getStatusClass(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('observation')) return 'status-observation';
  if (s.includes('cured'))       return 'status-cured';
  if (s.includes('inactive'))    return 'status-inactive';
  if (s.includes('untreated'))   return 'status-untreated';
  if (s.includes('treated'))     return 'status-cured';
  return 'status-observation';
}

// ─── POPULATE PATIENT LIST ────────────────────────────────────
function renderPatientList(patients, targetName) {
  const ul = document.getElementById('patient-list-ul');
  ul.innerHTML = '';

  patients.forEach(patient => {
    const isActive = patient.name === targetName;
    const li = document.createElement('li');
    li.className = 'patient-item' + (isActive ? ' patient-item--active' : '');
    li.setAttribute('role', 'listitem');
    if (isActive) li.setAttribute('aria-current', 'true');

    li.innerHTML = `
      <img
        src="${patient.profile_picture}"
        alt="${patient.name}"
        class="patient-item__avatar"
        width="48" height="48"
        loading="lazy"
        onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=E8E8E8&color=072635'"
      />
      <div class="patient-item__info">
        <p class="patient-item__name">${patient.name}</p>
        <p class="patient-item__meta">${patient.gender}, ${patient.age}</p>
      </div>
      <span class="patient-item__more" aria-hidden="true">···</span>
    `;

    ul.appendChild(li);
  });
}

// ─── POPULATE PATIENT PROFILE ─────────────────────────────────
function renderProfile(patient) {
  document.getElementById('profile-photo').src = patient.profile_picture;
  document.getElementById('profile-photo').alt = patient.name;
  document.getElementById('profile-name').textContent = patient.name;
  document.getElementById('profile-dob').textContent      = patient.date_of_birth || '—';
  document.getElementById('profile-gender').textContent    = patient.gender || '—';
  document.getElementById('profile-phone').textContent     = patient.phone_number || '—';
  document.getElementById('profile-emergency').textContent = patient.emergency_contact || '—';
  document.getElementById('profile-insurance').textContent = patient.insurance_type || '—';
}

// ─── POPULATE VITAL SIGNS ─────────────────────────────────────
function renderVitals(latest) {
  // Respiratory Rate
  document.getElementById('vital-respiratory').textContent       = latest.respiratory_rate?.value ?? '--';
  document.getElementById('vital-respiratory-level').textContent = latest.respiratory_rate?.levels ?? '';

  // Temperature
  document.getElementById('vital-temperature').textContent       = latest.temperature?.value ?? '--';
  document.getElementById('vital-temperature-level').textContent = latest.temperature?.levels ?? '';

  // Heart Rate
  document.getElementById('vital-heart').textContent       = latest.heart_rate?.value ?? '--';
  document.getElementById('vital-heart-level').textContent = latest.heart_rate?.levels ?? '';
}

// ─── POPULATE BP SUMMARY ──────────────────────────────────────
function renderBpSummary(latest) {
  const sys = latest.blood_pressure?.systolic;
  const dia = latest.blood_pressure?.diastolic;

  document.getElementById('bp-systolic-value').textContent  = sys?.value ?? '--';
  document.getElementById('bp-diastolic-value').textContent = dia?.value ?? '--';

  // Systolic level
  const sysLevel = getLevelArrow(sys?.levels);
  const sysArrow  = document.getElementById('bp-systolic-arrow');
  sysArrow.textContent = sysLevel.arrow;
  sysArrow.className   = 'bp-stat__arrow ' + sysLevel.cls;
  document.getElementById('bp-systolic-level-text').textContent  = sys?.levels ?? '--';

  // Diastolic level
  const diaLevel = getLevelArrow(dia?.levels);
  const diaArrow  = document.getElementById('bp-diastolic-arrow');
  diaArrow.textContent = diaLevel.arrow;
  diaArrow.className   = 'bp-stat__arrow ' + diaLevel.cls;
  document.getElementById('bp-diastolic-level-text').textContent = dia?.levels ?? '--';
}

// ─── POPULATE DIAGNOSTIC LIST ─────────────────────────────────
function renderDiagnosticList(diagnostics) {
  const tbody = document.getElementById('diagnostic-tbody');
  tbody.innerHTML = '';

  if (!diagnostics || diagnostics.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:20px;">No diagnostic data available</td>`;
    tbody.appendChild(tr);
    return;
  }

  diagnostics.forEach(item => {
    const statusClass = getStatusClass(item.status);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name || '—'}</td>
      <td>${item.description || '—'}</td>
      <td><span class="status-badge ${statusClass}">${item.status || '—'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── POPULATE LAB RESULTS ─────────────────────────────────────
function renderLabResults(labResults) {
  const ul = document.getElementById('lab-results-ul');
  ul.innerHTML = '';

  if (!labResults || labResults.length === 0) {
    ul.innerHTML = `<li style="color:var(--color-text-muted);padding:12px 0;">No lab results available</li>`;
    return;
  }

  labResults.forEach(result => {
    const li = document.createElement('li');
    li.className = 'lab-item';
    li.innerHTML = `
      <span class="lab-item__name">${result}</span>
      <button class="lab-item__dl" aria-label="Download ${result}">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    `;
    ul.appendChild(li);
  });
}

// ─── CHART.JS BLOOD PRESSURE CHART ───────────────────────────
let bpChartInstance = null;

function renderBpChart(diagnosisHistory) {
  // Take the last CHART_MONTHS entries (most recent = index 0, reverse to show oldest→newest)
  const chartData = diagnosisHistory
    .slice(0, CHART_MONTHS)
    .reverse();

  const labels        = chartData.map(d => `${d.month.slice(0, 3)}, ${d.year}`);
  const systolicData  = chartData.map(d => d.blood_pressure?.systolic?.value ?? 0);
  const diastolicData = chartData.map(d => d.blood_pressure?.diastolic?.value ?? 0);

  const canvas = document.getElementById('bpChart');
  const ctx    = canvas.getContext('2d');

  // Destroy existing chart instance to avoid canvas reuse error
  if (bpChartInstance) {
    bpChartInstance.destroy();
    bpChartInstance = null;
  }

  bpChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Systolic',
          data: systolicData,
          borderColor: '#E66FD2',
          backgroundColor: 'rgba(230, 111, 210, 0.15)',
          pointBackgroundColor: '#E66FD2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2.5,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Diastolic',
          data: diastolicData,
          borderColor: '#8C6FE6',
          backgroundColor: 'rgba(140, 111, 230, 0.15)',
          pointBackgroundColor: '#8C6FE6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2.5,
          tension: 0.4,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#072635',
          titleFont: { family: 'Manrope', size: 13 },
          bodyFont:  { family: 'Manrope', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label(context) {
              return ` ${context.dataset.label}: ${context.raw} mmHg`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { family: 'Manrope', size: 12 },
            color: '#707070',
          }
        },
        y: {
          min: 60,
          max: 180,
          grid: {
            color: 'rgba(0,0,0,0.06)',
            drawBorder: false,
          },
          border: { display: false },
          ticks: {
            font: { family: 'Manrope', size: 12 },
            color: '#707070',
            stepSize: 20,
          }
        }
      }
    }
  });
}

// ─── MAIN INIT ────────────────────────────────────────────────
async function init() {
  showLoading();

  try {
    const patients = await fetchPatients();

    // Find Jessica Taylor
    const jessica = patients.find(p => p.name === TARGET_PATIENT);
    if (!jessica) {
      throw new Error(`Patient "${TARGET_PATIENT}" not found in API response.`);
    }

    const diagnosisHistory = jessica.diagnosis_history || [];
    const latestEntry      = diagnosisHistory[0] || {};

    // Render all sections
    renderPatientList(patients, TARGET_PATIENT);
    renderProfile(jessica);
    renderVitals(latestEntry);
    renderBpSummary(latestEntry);
    renderDiagnosticList(jessica.diagnostic_list);
    renderLabResults(jessica.lab_results);

    // Render chart (after DOM is visible)
    renderBpChart(diagnosisHistory);

    hideLoading();
    showApp();

  } catch (err) {
    console.error('Dashboard error:', err);
    showError(err.message || 'Failed to load patient data. Please try again.');
  }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
