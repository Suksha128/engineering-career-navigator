# Engineering Career Navigator

Dijkstra's Shortest Path Algorithm applied to Engineering Career Route Finding

---

## Overview

A fully interactive web application that models 115+ engineering career milestones as a **weighted directed graph** and uses **Dijkstra's algorithm** to find the optimal (minimum effort) path from any starting qualification to any target career goal.

### Features

| Feature | Details |
|---------|---------|
| **Algorithm** | Dijkstra's Single-Source Shortest Path |
| **Graph** | 115 nodes · ~580 edges · 7 career domains |
| **Visualisation** | Interactive SVG graph with pan, zoom, domain filter |
| **Path display** | Step-by-step path with required skills per hop |
| **Algo trace** | Live Dijkstra step-by-step log panel |
| **Complexity** | O(V² log V) time · O(V+E) space |

### Career Domains

- 🟣 **Software Engineering** — Jr Dev → Staff → CTO
- 🟡 **Data / AI-ML** — Statistics → Deep Learning → AI Researcher
- 🟢 **Hardware & Embedded** — VLSI → FPGA → Chip Design
- 🟦 **Cloud & DevOps** — Docker → Kubernetes → SRE
- 🔴 **Cybersecurity** — AppSec → Red Team → CISO
- 🩵 **Management** — PM → Product Manager → VP Eng
- 🟠 **Research & Academia** — M.Tech → PhD → Professor

---

## Project Structure

```
engineering-career-navigator/
│
├── package.json              ← npm manifest & scripts
├── README.md                 ← this file
│
├── src/
│   └── server.js             ← Express server (serves /public)
│
└── public/
    ├── index.html            ← Main HTML entry point
    ├── styles.css            ← Complete CSS (dark theme, layout)
    ├── graph-data.js         ← All 115 nodes + 290 edge definitions
    ├── dijkstra.js           ← Dijkstra algorithm + buildGraph()
    ├── graph-renderer.js     ← SVG render, pan/zoom, tooltip, layout
    └── ui.js                 ← Sidebar controls, result panel, selects
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 16  
  Download: https://nodejs.org

### 1. Install dependencies

```bash
cd engineering-career-navigator
npm install
```

### 2. Start the server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

### 3. Open the app

Open your browser and go to:

```
http://localhost:3000
```

---

## How to Use

1. **Select Starting Point** — choose your current qualification (e.g. B.E / B.Tech)
2. **Select Career Goal** — choose your target career (e.g. CTO, AI Researcher, CISO)
3. **Click "▶ Find Shortest Path"** — Dijkstra's algorithm runs and highlights the optimal route
4. **Read the result panel** — see each step, the skill required for each transition, and the full skills list
5. **Click "∑ Algo Steps"** — toggle the live Dijkstra execution trace
6. **Use the Domain Filter** — narrow the graph to one domain for clarity
7. **Pan & Zoom** — drag to pan, scroll to zoom, or use the toolbar buttons
8. **Click any node** — sets it as your start or goal

---

## Algorithm Details

### Dijkstra's Algorithm

```
INIT:
  dist[v]  ← ∞  for all v ∈ V
  dist[src] ← 0
  PQ ← { (src, 0) }

WHILE PQ ≠ ∅:
  u ← EXTRACT-MIN(PQ)          // sorted array → O(|PQ| log |PQ|)
  IF u ∈ visited: CONTINUE
  ADD(visited, u)               // settle u
  IF u = dst: BREAK             // early termination

  FOR EACH (u → v, w, skill):
    IF alt = dist[u] + w < dist[v]:
      dist[v] ← alt             // RELAX
      prev[v] ← u
      pq.push(v, alt)
```

### Complexity

| | Complexity |
|---|---|
| Time  | **O(V² log V)** — sorted array PQ |
| Space | **O(V + E)** |
| With Binary Heap | O((V+E) log V) |

All edge weights are **strictly positive** (w ∈ {1…7}), satisfying Dijkstra's correctness requirement.

---

## Technology Stack

- **Frontend** — Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Graph** — Pure SVG rendered via DOM API
- **Server** — Node.js + Express (static file server)
- **Fonts** — Google Fonts (Space Mono, Syne, DM Sans)
- **No external JS dependencies** on the frontend

