/**
 * ui.js
 * Sidebar controls, path result panel, skill tags, select population.
 * Depends on: graph-data.js, dijkstra.js, graph-renderer.js
 */

// ── Populate dropdowns ────────────────────────────────────────────────────────
function populateSelects() {
  const srcEl  = document.getElementById('src-select');
  const dstEl  = document.getElementById('dst-select');
  const sorted = [...NODES].sort((a, b) => a.label.localeCompare(b.label));

  sorted.forEach(n => {
    srcEl.appendChild(new Option(`${n.label}  [${n.domain}]`, n.id));
    dstEl.appendChild(new Option(`${n.label}  [${n.domain}]`, n.id));
  });

  // Default selection
  srcEl.value = 'BE';
  dstEl.value = 'CTO';
}

// ── Run Dijkstra and update UI ────────────────────────────────────────────────
function runDijkstra() {
  const src = document.getElementById('src-select').value;
  const dst = document.getElementById('dst-select').value;

  if (!src || !dst) {
    alert('Please select both a starting point and a career goal.');
    return;
  }
  if (src === dst) {
    alert('Starting point and career goal must be different nodes.');
    return;
  }

  const result = dijkstra(currentGraph, src, dst);
  currentPath  = result.path;

  // Re-render graph with highlighted path
  const domain = document.getElementById('domain-filter').value;
  renderGraph(domain, result.path);
  applyTransform();

  // Populate algo steps panel
  const stepsDiv = document.getElementById('algo-steps');
  stepsDiv.innerHTML = result.steps.slice(0, 40).map(s =>
    `<div class="algo-step ${s.startsWith('Visit') ? 'active' : ''}">${s}</div>`
  ).join('');

  // Show result panel
  showResult(result, src, dst);

  // Auto-centre on the found path
  if (result.path.length > 0) centerOnPath(result.path);
}

// ── Render shortest-path result in sidebar ────────────────────────────────────
function showResult(result) {
  const panel   = document.getElementById('result-panel');
  const nm      = (() => { const m = {}; NODES.forEach(n => { m[n.id] = n; }); return m; })();
  const colorFn = id => DOMAIN_COLORS[nm[id]?.domain] || '#6b7280';

  if (result.path.length === 0) {
    panel.innerHTML = `
      <div class="placeholder">
        <div class="icon">⚠</div>
        No path found between these nodes.<br>
        Try a different combination.
      </div>`;
    return;
  }

  // ── Path steps ────────────────────────────────────────────────────
  let html = `<div class="result-title">Optimal Path Found</div>`;

  result.path.forEach((id, idx) => {
    const node      = nm[id];
    const color     = colorFn(id);
    const edgeSkill = idx < result.edges.length ? result.edges[idx] : '';
    const edgePrev  = idx > 0 && result.edges[idx - 1] ? result.edges[idx - 1] : '';

    html += `
      <div class="path-step" style="animation-delay:${idx * 0.05}s">
        <div class="step-num"
             style="background:${color}22;color:${color};border:1px solid ${color}44">
          ${idx + 1}
        </div>
        <div style="flex:1;min-width:0">
          <div class="step-node">${node?.label || id}</div>
          <div class="step-skill">${(node?.domain || '').toUpperCase()}</div>
          ${edgePrev
            ? `<div class="step-skill" style="color:#7c3aed">→ ${edgePrev}</div>`
            : ''}
        </div>
        ${idx === 0
          ? '<div class="step-cost" style="color:#10b981">START</div>'
          : `<div class="step-cost">+w</div>`}
      </div>`;
  });

  // ── Total cost ────────────────────────────────────────────────────
  html += `
    <div class="total-cost">
      <div class="label">Total Path Cost</div>
      <div class="value">${result.cost} units</div>
    </div>`;

  // ── Skills to acquire ─────────────────────────────────────────────
  const allSkills = new Set();
  result.path.forEach(id => {
    (nm[id]?.skills || []).forEach(s => allSkills.add(s));
  });
  const skillArr = [...allSkills];

  html += `
    <div class="skills-needed">
      <div class="skills-title">Skills to Acquire (${skillArr.length})</div>
      ${skillArr.slice(0, 24).map((s, i) => {
        const type = i % 3 === 0 ? 'core' : i % 3 === 1 ? 'tool' : 'soft';
        return `<span class="skill-tag ${type}">${s}</span>`;
      }).join('')}
      ${skillArr.length > 24
        ? `<span class="skill-tag soft">+${skillArr.length - 24} more</span>`
        : ''}
    </div>`;

  panel.innerHTML = html;
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetGraph() {
  currentPath = [];
  const domain = document.getElementById('domain-filter').value;
  renderGraph(domain, []);
  document.getElementById('result-panel').innerHTML = `
    <div class="placeholder">
      <div class="icon">🗺</div>
      Select a <b>start node</b> and <b>goal</b>, then hit<br>
      <b>Find Shortest Path</b> to discover the optimal<br>
      career route with required skills.
    </div>`;
  document.getElementById('algo-steps').innerHTML = '';
}

// ── Domain filter watcher ─────────────────────────────────────────────────────
document.getElementById('domain-filter').addEventListener('change', () => {
  renderGraph(document.getElementById('domain-filter').value, currentPath);
  applyTransform();
});
