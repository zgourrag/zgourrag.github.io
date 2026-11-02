:root {
  --bg: #F4F2E9;       /* Warm off-white */
  --text: #151515;     /* Pitch black */
  --muted: #666666;    /* Neutral grey */
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  max-width: 600px;
  margin: 80px auto;
  padding: 0 24px;
  line-height: 1.6;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.tagline {
  color: var(--muted);
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 4px;
}

hr {
  border: none;
  border-top: 1px solid var(--text);
  margin: 32px 0;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 12px;
}

ul {
  list-style-position: inside;
}

li {
  margin-bottom: 8px;
}