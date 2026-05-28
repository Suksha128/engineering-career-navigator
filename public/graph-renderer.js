/**
 * graph-renderer.js
 * Handles:
 *   - Domain-clustered node layout (initPositions)
 *   - SVG edge + node rendering with shortest-path highlight
 *   - Pan & zoom via mouse drag + wheel
 *   - Hover tooltip
 */

// ── State ─────────────────────────────────────────────────────────────────────
let positions       = {};
let transform       = { x: 0, y: 0, scale: 1 };
let isDragging      = false;
let lastMouse       = null;
let algoStepsVisible = false;
let currentPath     = [];
let currentGraph    = null;

// ── Layout constants ──────────────────────────────────────────────────────────
const CANVAS_W = 2800;
const CANVAS_H = 2200;

const DOMAIN_CENTERS = {
  foundation: { x: CANVAS_W * 0.50, y: CANVAS_H * 0.08 },
  software:   { x: CANVAS_W * 0.20, y: CANVAS_H * 0.35 },
  data:       { x: CANVAS_W * 0.50, y: CANVAS_H * 0.35 },
  hardware:   { x: CANVAS_W * 0.80, y: CANVAS_H * 0.35 },
  cloud:      { x: CANVAS_W * 0.20, y: CANVAS_H * 0.65 },
  cyber:      { x: CANVAS_W * 0.50, y: CANVAS_H * 0.65 },
  management: { x: CANVAS_W * 0.75, y: CANVAS_H * 0.65 },
  research:   { x: CANVAS_W * 0.92, y: CANVAS_H * 0.50 },
};

// ── Node lookup map (built on first call) ─────────────────────────────────────
let NODE_MAP = null;
function getNodeMap() {
  if (!NODE_MAP) {
    NODE_MAP = {};
    NODES.forEach(n => { NODE_MAP[n.id] = n; });
  }
  return NODE_MAP;
}

// ── Layout initialisation ─────────────────────────────────────────────────────
/**
 * Assigns (x,y) positions for every node, clustering by domain.
 * @param {Array} nodeList
 */
function initPositions(nodeList) {
  const domainCounts = {};
  nodeList.forEach(n => {
    domainCounts[n.domain] = (domainCounts[n.domain] || 0) + 1;
  });

  const domainIdx = {};
  nodeList.forEach(n => {
    if (!domainIdx[n.domain]) domainIdx[n.domain] = 0;
    const idx   = domainIdx[n.domain]++;
    const total = domainCounts[n.domain];
    const cols  = Math.ceil(Math.sqrt(total));
    const row   = Math.floor(idx / cols);
    const col   = idx % cols;
    const cx    = (DOMAIN_CENTERS[n.domain] || { x: CANVAS_W / 2, y: CANVAS_H / 2 }).x;
    const cy    = (DOMAIN_CENTERS[n.domain] || { x: CANVAS_W / 2, y: CANVAS_H / 2 }).y;
    const spread = 170;

    positions[n.id] = {
      x: cx + (col - cols / 2) * spread + (Math.random() - 0.5) * 40,
      y: cy + (row - Math.ceil(total / cols) / 2) * spread + (Math.random() - 0.5) * 40
    };
  });
}

// ── SVG helper ────────────────────────────────────────────────────────────────
function svgEl(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

// ── Render ────────────────────────────────────────────────────────────────────
/**
 * Full re-render of the SVG graph.
 * @param {string}   filterDomain   — 'all' or a domain key
 * @param {string[]} highlightPath  — ordered node id array for shortest path
 */
function renderGraph(filterDomain = 'all', highlightPath = []) {
  const nm = getNodeMap();

  const visibleNodes = filterDomain === 'all'
    ? NODES
    : NODES.filter(n => n.domain === filterDomain || n.domain === 'foundation');
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  document.getElementById('node-count').textContent = visibleNodes.length;

  // ── Edges ────────────────────────────────────────────────────────
  const eLayer = document.getElementById('edges-layer');
  eLayer.innerHTML = '';
  let edgeCount = 0;

  EDGES_RAW.forEach(([s, d, w]) => {
    if (!visibleIds.has(s) || !visibleIds.has(d)) return;
    edgeCount++;
    const ps = positions[s], pd = positions[d];
    if (!ps || !pd) return;

    const onPath = highlightPath.length > 1 && highlightPath.some((n, i) =>
      i < highlightPath.length - 1 &&
      highlightPath[i] === s && highlightPath[i + 1] === d
    );

    const line = svgEl('line');
    line.setAttribute('x1', ps.x); line.setAttribute('y1', ps.y);
    line.setAttribute('x2', pd.x); line.setAttribute('y2', pd.y);
    line.setAttribute('stroke',         onPath ? '#00e5ff' : '#252535');
    line.setAttribute('stroke-width',   onPath ? 3 : 1);
    line.setAttribute('stroke-opacity', onPath ? 1 : 0.5);
    line.setAttribute('marker-end',     onPath ? 'url(#arrow-path)' : 'url(#arrow)');
    if (onPath) line.setAttribute('filter', 'url(#glow)');
    eLayer.appendChild(line);

    // Weight label on path edges
    if (onPath) {
      const mx = (ps.x + pd.x) / 2, my = (ps.y + pd.y) / 2;
      const txt = svgEl('text');
      txt.setAttribute('x', mx);
      txt.setAttribute('y', my - 6);
      txt.setAttribute('fill', '#f59e0b');
      txt.setAttribute('font-size', '11');
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-family', 'Space Mono, monospace');
      txt.textContent = `w=${w}`;
      eLayer.appendChild(txt);
    }
  });

  document.getElementById('edge-count').textContent = edgeCount;

  // ── Nodes ────────────────────────────────────────────────────────
  const nLayer = document.getElementById('nodes-layer');
  nLayer.innerHTML = '';

  visibleNodes.forEach(n => {
    const pos    = positions[n.id];
    if (!pos) return;
    const color  = DOMAIN_COLORS[n.domain] || '#6b7280';
    const onPath = highlightPath.includes(n.id);
    const isStart = highlightPath[0] === n.id;
    const isEnd   = highlightPath[highlightPath.length - 1] === n.id;

    const g = svgEl('g');
    g.setAttribute('cursor', 'pointer');
    g.setAttribute('transform', `translate(${pos.x},${pos.y})`);

    // Glow ring for path nodes
    if (onPath) {
      const ring = svgEl('circle');
      ring.setAttribute('r',              isStart || isEnd ? 26 : 22);
      ring.setAttribute('fill',           'none');
      ring.setAttribute('stroke',         isStart ? '#10b981' : isEnd ? '#f59e0b' : '#00e5ff');
      ring.setAttribute('stroke-width',   2);
      ring.setAttribute('stroke-opacity', 0.6);
      ring.setAttribute('filter',         'url(#glow)');
      g.appendChild(ring);
    }

    const r = isStart || isEnd ? 20 : onPath ? 18 : 14;
    const circle = svgEl('circle');
    circle.setAttribute('r',            r);
    circle.setAttribute('fill',         onPath ? (isStart ? '#10b981' : isEnd ? '#f59e0b' : color) : color);
    circle.setAttribute('fill-opacity', onPath ? 1 : 0.7);
    circle.setAttribute('stroke',       onPath ? '#fff' : 'transparent');
    circle.setAttribute('stroke-width', onPath ? 1.5 : 0);
    g.appendChild(circle);

    // Label text
    const label = svgEl('text');
    label.setAttribute('text-anchor',       'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('fill',              '#fff');
    label.setAttribute('font-size',         onPath ? '10' : '9');
    label.setAttribute('font-family',       'DM Sans, sans-serif');
    label.setAttribute('font-weight',       onPath ? '700' : '400');
    label.setAttribute('pointer-events',    'none');

    const words = n.label.split(' ');
    if (words.length > 2) {
      const t1 = svgEl('tspan');
      t1.setAttribute('x', 0); t1.setAttribute('dy', '-5');
      t1.textContent = words.slice(0, 2).join(' ');
      const t2 = svgEl('tspan');
      t2.setAttribute('x', 0); t2.setAttribute('dy', '11');
      t2.textContent = words.slice(2).join(' ');
      label.appendChild(t1);
      label.appendChild(t2);
    } else {
      label.textContent = n.label;
    }
    g.appendChild(label);

    // Events
    g.addEventListener('mouseenter', e => showTooltip(e, n));
    g.addEventListener('mouseleave', hideTooltip);
    g.addEventListener('click', () => {
      const src = document.getElementById('src-select');
      const dst = document.getElementById('dst-select');
      if (!src.value || src.value === n.id) src.value = n.id;
      else dst.value = n.id;
    });

    nLayer.appendChild(g);
  });

  document.getElementById('domain-shown').textContent =
    filterDomain === 'all'
      ? 'All'
      : filterDomain.charAt(0).toUpperCase() + filterDomain.slice(1);
}

// ── Transform helpers ─────────────────────────────────────────────────────────
function applyTransform() {
  document.getElementById('graph-root').setAttribute(
    'transform',
    `translate(${transform.x},${transform.y}) scale(${transform.scale})`
  );
}

function zoomIn()  { transform.scale = Math.min(transform.scale * 1.2, 4);   applyTransform(); }
function zoomOut() { transform.scale = Math.max(transform.scale / 1.2, 0.1); applyTransform(); }

function resetView() {
  const svg = document.getElementById('graph-svg');
  transform = {
    x:     svg.clientWidth  / 2 - 1400,
    y:     svg.clientHeight / 2 - 1100,
    scale: 0.3
  };
  applyTransform();
}

function centerOnPath(path) {
  if (!path.length) return;
  const svg = document.getElementById('graph-svg');
  const W   = svg.clientWidth;
  const H   = svg.clientHeight;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  path.forEach(id => {
    const p = positions[id];
    if (p) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
  });

  const pw    = maxX - minX + 200;
  const ph    = maxY - minY + 200;
  const scale = Math.min(W / pw, H / ph, 1.5);
  transform.scale = scale;
  transform.x     = W / 2 - (minX + maxX) / 2 * scale;
  transform.y     = H / 2 - (minY + maxY) / 2 * scale;
  applyTransform();
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function showTooltip(e, node) {
  const tt = document.getElementById('tooltip');
  document.getElementById('tt-name').textContent   = node.label;
  document.getElementById('tt-domain').textContent = node.domain.toUpperCase();
  document.getElementById('tt-skills').textContent = (node.skills || []).join(', ');
  tt.classList.add('visible');
  positionTooltip(e);
}
function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}
function positionTooltip(e) {
  const tt = document.getElementById('tooltip');
  tt.style.left = (e.clientX + 14) + 'px';
  tt.style.top  = (e.clientY - 10) + 'px';
}
document.addEventListener('mousemove', e => {
  if (document.getElementById('tooltip').classList.contains('visible')) positionTooltip(e);
});

// ── Pan & zoom event wiring ───────────────────────────────────────────────────
function wireGraphInteractions() {
  const svg = document.getElementById('graph-svg');

  svg.addEventListener('mousedown', e => {
    if (e.target === svg || e.target.tagName === 'g') {
      isDragging = true;
      lastMouse  = { x: e.clientX, y: e.clientY };
    }
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging || !lastMouse) return;
    transform.x += e.clientX - lastMouse.x;
    transform.y += e.clientY - lastMouse.y;
    lastMouse = { x: e.clientX, y: e.clientY };
    applyTransform();
  });
  window.addEventListener('mouseup', () => { isDragging = false; lastMouse = null; });

  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect   = svg.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;
    transform.x  = mx - (mx - transform.x) * factor;
    transform.y  = my - (my - transform.y) * factor;
    transform.scale *= factor;
    applyTransform();
  }, { passive: false });
}

// ── Algo panel toggle ─────────────────────────────────────────────────────────
function toggleAlgo() {
  algoStepsVisible = !algoStepsVisible;
  document.getElementById('algo-panel').classList.toggle('visible', algoStepsVisible);
}
