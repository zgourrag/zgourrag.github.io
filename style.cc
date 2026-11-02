:root {
  --os-bg: #151515;       /* Pitch Black */
  --os-surface: #222222;  /* Dark Gray */
  --os-border-light: #444444; 
  --os-border-dark: #000000;
  --os-text: #F4F2E9;     /* Warm Off-White */
  --os-accent: #C6F22D;   /* Ravens Lime */
  --os-accent-dark: #82a317;
  --font-mono: 'JetBrains Mono', monospace;
  --font-sans: 'Inter', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--os-bg);
  color: var(--os-text);
  font-family: var(--font-sans);
  height: 100vh;
  overflow: hidden;
  user-select: none;
}

/* Desktop */
.desktop {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}

.desktop-icon {
  width: 80px;
  text-align: center;
  cursor: pointer;
}

.desktop-icon:hover .icon-label {
  background-color: var(--os-accent);
  color: var(--os-bg);
}

.icon-img {
  font-size: 2.5rem;
  margin-bottom: 5px;
}

.icon-label {
  font-size: 0.85rem;
  padding: 2px 4px;
  font-family: var(--font-mono);
}

/* Windows */
.window {
  position: absolute;
  top: 100px;
  left: 150px;
  width: 450px;
  background: var(--os-surface);
  border-top: 2px solid var(--os-border-light);
  border-left: 2px solid var(--os-border-light);
  border-right: 2px solid var(--os-border-dark);
  border-bottom: 2px solid var(--os-border-dark);
  display: none; /* Hidden initially */
  box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
}

.window-header {
  background: var(--os-text);
  color: var(--os-bg);
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  cursor: grab;
}

.window-title { font-family: var(--font-sans); font-size: 0.9rem; }

.close-btn {
  background: var(--os-surface);
  color: var(--os-text);
  border: 1px solid var(--os-bg);
  cursor: pointer;
  padding: 0 4px;
  font-weight: bold;
}

.close-btn:hover { background: red; color: white; }

.window-toolbar {
  padding: 4px 8px;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--os-border-dark);
  background: #2a2a2a;
}

.window-content {
  padding: 15px;
  height: 250px;
  overflow-y: auto;
  background: var(--os-bg);
  border-top: 2px solid var(--os-border-dark);
  border-left: 2px solid var(--os-border-dark);
}

.text-file { font-family: var(--font-mono); font-size: 0.9rem; line-height: 1.5; }

.folder-view {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-content: flex-start;
}

.file-item {
  width: 70px;
  text-align: center;
  cursor: pointer;
}

.file-item .icon-img { font-size: 2rem; }
.file-item span { font-size: 0.8rem; word-break: break-all; }
.file-item:hover span { background: var(--os-accent); color: var(--os-bg); }

/* Taskbar */
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: var(--os-surface);
  border-top: 2px solid var(--os-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  z-index: 9999;
}

.taskbar-left, .taskbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.start-btn {
  background: var(--os-surface);
  color: var(--os-text);
  border-top: 2px solid var(--os-border-light);
  border-left: 2px solid var(--os-border-light);
  border-right: 2px solid var(--os-border-dark);
  border-bottom: 2px solid var(--os-border-dark);
  padding: 4px 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.start-btn:active {
  border-top: 2px solid var(--os-border-dark);
  border-left: 2px solid var(--os-border-dark);
}

.system-dot {
  width: 10px;
  height: 10px;
  background: var(--os-accent);
  display: inline-block;
  border-radius: 50%;
}

.status-tag { font-size: 0.8rem; color: #888; }
#systemClock { font-family: var(--font-mono); font-size: 0.9rem; }

/* Start Menu */
.start-menu {
  position: absolute;
  bottom: 45px;
  left: 10px;
  width: 250px;
  background: var(--os-surface);
  border: 2px solid var(--os-border-light);
  border-right-color: var(--os-border-dark);
  border-bottom-color: var(--os-border-dark);
  display: none;
  flex-direction: row;
}

.start-menu-sidebar {
  background: var(--os-accent);
  color: var(--os-bg);
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  padding: 10px 5px;
  font-weight: bold;
  font-family: var(--font-sans);
  font-size: 1.2rem;
  letter-spacing: 2px;
}

.start-menu-items { width: 100%; display: flex; flex-direction: column; }

.menu-item {
  padding: 10px 15px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  color: var(--os-text);
}

.menu-item:hover { background: var(--os-accent); color: var(--os-bg); }
.menu-divider { height: 1px; background: var(--os-border-light); margin: 5px 0; }