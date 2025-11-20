// after_login_admin.js (replace existing)
// Assumes the HTML present in your admin page

// -------- helpers ----------
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.json();
}

// Global cache
let FEEDBACK = {}; // structure: { branch: { teacher: { answers: [10], count } } }
let BRANCHES = [];

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadBranchesAndSummary();
    populateDepartmentDropdowns();
    attachEventHandlers();
    // initial dashboard rendering is based on summary route
    await loadDashboardSummary();
  } catch (err) {
    console.error(err);
    alert("Failed to load admin data");
  }
});

// ---------- Load branches list ----------
async function loadBranchesAndSummary() {
  const j = await fetchJSON("/admin/branches");
  BRANCHES = (j.success && j.branches) || [];

  // Optionally preload nothing; FEEDBACK will be fetched on demand for branch
  // But for quick UX, you can prefetch all branch data:
  for (const b of BRANCHES) {
    try {
      const r = await fetchJSON(`/admin/branch-results?branch=${encodeURIComponent(b)}`);
      if (r.success) FEEDBACK[b] = r.data;
    } catch (e) {
      // ignore single-branch failures
      console.warn("prefetch branch failed", b, e);
    }
  }
}

// ---------- Dashboard summary (cards & dept chart) ----------
async function loadDashboardSummary() {
  try {
    const s = await fetchJSON("/admin/summary");
    if (!s.success) return;

    const summary = s.summary;
    // Totals
    document.getElementById("card-departments").textContent = summary.totals.branches;
    document.getElementById("card-teachers").textContent = summary.totals.teachers;
    document.getElementById("card-feedbacks").textContent = summary.totals.feedbackEntries;

    // avg across departments (weighted by teacher counts not required; use simple average)
    const deptAvg = summary.departments.reduce((a,b)=>a+b.avg,0) / Math.max(1, summary.departments.length);
    document.getElementById("card-avg").textContent = isNaN(deptAvg) ? "-" : deptAvg.toFixed(2);

    document.getElementById("last-updated").textContent = new Date().toLocaleString();

    // department chart
    const labels = summary.departments.map(d => d.branch);
    const values = summary.departments.map(d => d.avg);

    // render chart
    const ctx = document.getElementById("deptChart").getContext("2d");
    if (window._deptChart) window._deptChart.destroy();
    window._deptChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Department Avg", data: values }]
      }
    });

  } catch (err) {
    console.error("dashboard summary error", err);
  }
}

// ---------- Populate department dropdowns ----------
function populateDepartmentDropdowns() {
  const selects = ["select-department", "report-dept"];
  selects.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">-- Select Department --</option>`;
    for (const b of BRANCHES) {
      el.innerHTML += `<option value="${b}">${b}</option>`;
    }
  });
}

// ---------- Event handlers ----------
function attachEventHandlers() {
  document.getElementById("select-department").addEventListener("change", async () => {
    const branch = document.getElementById("select-department").value;
    if (!branch) return;
    // fetch branch data if not prefetched
    if (!FEEDBACK[branch]) {
      try {
        const r = await fetchJSON(`/admin/branch-results?branch=${encodeURIComponent(branch)}`);
        if (r.success) FEEDBACK[branch] = r.data;
      } catch (err) {
        console.error(err);
        alert("Failed to load branch data");
        return;
      }
    }
    renderDepartmentTable();
  });

  document.getElementById("search-teacher").addEventListener("input", renderDepartmentTable);

  // export CSV
  document.getElementById("export-csv").addEventListener("click", exportCSVAll);

  // modal close
  document.getElementById("modal-close").addEventListener("click", () => {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
}

// ---------- Render department teacher table ----------
function renderDepartmentTable() {
  const branch = document.getElementById("select-department").value;
  const search = document.getElementById("search-teacher").value.toLowerCase();
  const body = document.getElementById("teachers-table-body");
  body.innerHTML = "";

  if (!branch) return;
  const branchData = FEEDBACK[branch] || {};
  const teachers = Object.keys(branchData).sort();

  for (const name of teachers) {
    if (search && !name.toLowerCase().includes(search)) continue;
    const tdata = branchData[name];
    const avg = (tdata.answers.reduce((a,b)=>a+b,0) / tdata.answers.length).toFixed(2);
    const count = tdata.count || 0;

    body.innerHTML += `
      <tr>
        <td class="p-2">${escapeHtml(name)}</td>
        <td class="p-2">Professor</td>
        <td class="p-2">--</td>
        <td class="p-2">${avg}</td>
        <td class="p-2">${count}</td>
        <td class="p-2">
          <button class="px-2 py-1 bg-indigo-600 text-white rounded" onclick="openTeacherModal('${encodeURIComponent(branch)}','${encodeURIComponent(name)}')">View</button>
        </td>
      </tr>
    `;
  }
}

// ---------- Modal: open teacher details ----------
window.openTeacherModal = function(branchEnc, nameEnc) {
  const branch = decodeURIComponent(branchEnc);
  const name = decodeURIComponent(nameEnc);
  const modal = document.getElementById("modal");
  const data = (FEEDBACK[branch] && FEEDBACK[branch][name]);
  if (!data) {
    alert("No data for this teacher");
    return;
  }

  document.getElementById("modal-title").textContent = name;
  const avg = (data.answers.reduce((a,b)=>a+b,0) / data.answers.length).toFixed(2);
  document.getElementById("modal-avg").textContent = avg;
  document.getElementById("modal-count").textContent = data.count || 0;

  // display question-wise averages (10 items)
  const remarksEl = document.getElementById("modal-remarks");
  remarksEl.innerHTML = "";
  data.answers.forEach((val, i) => {
    const li = document.createElement("li");
    li.textContent = `Q${i+1}: ${val}`;
    remarksEl.appendChild(li);
  });

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

// ---------- Export CSV: all branch-teacher averages ----------
function exportCSVAll() {
  let rows = [["Branch","Teacher","Count","Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10"]];
  for (const branch of Object.keys(FEEDBACK)) {
    for (const teacher of Object.keys(FEEDBACK[branch])) {
      const t = FEEDBACK[branch][teacher];
      rows.push([branch, teacher, t.count || 0, ...t.answers]);
    }
  }

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "feedback_averages.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Utility ----------
function escapeHtml(s) {
  if (!s) return s;
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
