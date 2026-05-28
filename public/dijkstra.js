/**
 * dijkstra.js
 * Dijkstra's Single-Source Shortest Path — Sorted Array Priority Queue
 *
 * Time complexity : O(V² log V)  — sort-based PQ with lazy deletion
 * Space complexity: O(V + E)
 *
 * All edge weights must be > 0 for correctness.
 */

/**
 * Build an adjacency list from the raw edge tuples.
 * Edges are made bidirectional: forward weight w, reverse weight w+1.
 *
 * @param  {Array}  nodes  — array of node objects { id, ... }
 * @param  {Array}  edges  — array of [src, dst, weight, skill]
 * @returns {Object}       — adjacency list: { nodeId: [{to, weight, skill}] }
 */
function buildGraph(nodes, edges) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });

  edges.forEach(([s, d, w, skill]) => {
    if (adj[s] !== undefined && adj[d] !== undefined) {
      adj[s].push({ to: d, weight: w,     skill });   // forward direction
      adj[d].push({ to: s, weight: w + 1, skill });   // reverse (slightly costlier)
    }
  });
  return adj;
}

/**
 * Dijkstra's algorithm — finds the shortest path from src to dst.
 *
 * @param  {Object} graph — adjacency list from buildGraph()
 * @param  {string} src   — source node id
 * @param  {string} dst   — destination node id
 * @returns {{ path: string[], cost: number, edges: string[], steps: string[] }}
 */
function dijkstra(graph, src, dst) {
  const dist     = {};   // dist[v]     = best known distance from src
  const prev     = {};   // prev[v]     = predecessor on best path
  const prevEdge = {};   // prevEdge[v] = skill label of the best incoming edge
  const visited  = new Set();
  const steps    = [];   // trace log for the "Algo Steps" panel

  // ── Initialise — O(V) ────────────────────────────────────────────
  NODES.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[src] = 0;

  // Priority queue seeded with source (lazy-deletion pattern)
  let pq = [{ id: src, d: 0 }];

  // ── Main loop ────────────────────────────────────────────────────
  while (pq.length > 0) {

    // EXTRACT-MIN: sort ascending by distance, then shift — O(|PQ| log |PQ|)
    pq.sort((a, b) => a.d - b.d);
    const { id: u } = pq.shift();

    // Lazy deletion: skip stale PQ entries
    if (visited.has(u)) continue;
    visited.add(u);

    steps.push(`Visit: ${u} (dist=${dist[u]})`);

    // Early termination — destination settled
    if (u === dst) break;

    // ── Edge relaxation — O(deg(u)) ──────────────────────────────
    (graph[u] || []).forEach(({ to, weight, skill }) => {
      if (visited.has(to)) return;          // skip settled nodes

      const alt = dist[u] + weight;
      if (alt < dist[to]) {                 // RELAXATION condition
        dist[to]     = alt;
        prev[to]     = u;
        prevEdge[to] = skill;
        pq.push({ id: to, d: alt });        // lazy insert (may create duplicates)
        steps.push(`  Relax: ${to} → ${alt} via ${skill}`);
      }
    });
  }

  // ── Path reconstruction — O(V) ───────────────────────────────────
  if (dist[dst] === Infinity) {
    return { path: [], cost: Infinity, edges: [], steps };
  }

  const path = [], edgesOnPath = [];
  let cur = dst;
  while (cur) {
    path.unshift(cur);
    if (prev[cur]) edgesOnPath.unshift(prevEdge[cur]);
    cur = prev[cur];
  }

  return { path, cost: dist[dst], edges: edgesOnPath, steps };
}
