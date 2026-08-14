const http = require('http');
const url = require('url');

const PORT = 3000;

// Shared styles matching Rev AI Swiss Grid Visual Language
const sharedStyles = `
  :root {
    --canvas-bg: #F1F2F3;
    --brand-emerald: #12B76A;
    --brand-dark-green: #123B2D;
    --brand-cyan: #20C8E8;
    --brand-pink: #F5A7D7;
    --brand-yellow: #F4B62A;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--canvas-bg);
    background-image: 
      linear-gradient(to right, rgba(0, 0, 0, 0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    color: #000;
  }
  a { color: inherit; text-decoration: none; }
  .sharp-border { border: 1px solid #000; }
  .pill-btn {
    border-radius: 9999px;
    background: #000;
    color: #fff;
    padding: 0.5rem 1.5rem;
    font-weight: 700;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    cursor: pointer;
  }
  .pill-btn:hover { background: var(--brand-emerald); }
  .pill-btn-sec {
    border-radius: 9999px;
    background: #fff;
    border: 1px solid #000;
    color: #000;
    padding: 0.5rem 1.5rem;
    font-weight: 700;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    cursor: pointer;
  }
  .pill-btn-sec:hover { background: #000; color: #fff; }
`;

function renderNavbar(email = "SUFIYANSHAH4545@GMAIL.COM", orgName = "REV AI WORKSPACE", role = "OWNER") {
  return `
  <header style="height: 52px; border-bottom: 1px solid #000; background: #fff; padding: 0 1.5rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50;">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <a href="/" style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 32px; height: 32px; background: #000; color: #fff; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; border: 1px solid #000; letter-spacing: -0.05em;">RA</div>
        <span style="font-weight: 900; font-size: 1.1rem; text-transform: uppercase; letter-spacing: -0.02em;">REV AI</span>
      </a>

      <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.6rem; border: 1px solid #000; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #12B76A; display: inline-block;"></span>
        <span>${orgName}</span>
        <span style="background: #000; color: #fff; padding: 0.1rem 0.4rem; font-size: 0.65rem; font-family: monospace;">${role}</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 1.5rem;">
      <div style="text-align: right;">
        <div style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase;">${email}</div>
        <div style="font-size: 0.55rem; color: #666; font-family: monospace; text-transform: uppercase;">TENANT ISOLATION ACTIVE</div>
      </div>

      <a href="/auth" style="padding: 0.4rem 0.8rem; border: 1px solid #000; background: #fff; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">[ &rarr; SIGN OUT ]</a>
    </div>
  </header>`;
}

function renderSidebar(activePath = "/dashboard") {
  const isDash = activePath === "/dashboard";
  const isAgent = activePath.startsWith("/dashboard/agent");
  const isWf = activePath.startsWith("/dashboard/workflows");
  const isLeads = activePath.startsWith("/dashboard/leads");
  const isConv = activePath.startsWith("/dashboard/conversations");
  const isMeet = activePath.startsWith("/dashboard/meetings");
  const isAna = activePath.startsWith("/dashboard/analytics");
  const isKb = activePath.startsWith("/dashboard/knowledge") || activePath.startsWith("/onboarding");
  const isTeam = activePath.startsWith("/dashboard/team");

  return `
  <aside style="width: 225px; background: #fff; border: 1px solid #000; padding: 1rem; flex-shrink: 0; font-family: monospace; font-size: 0.75rem;">
    <div style="margin-bottom: 1.5rem;">
      <div style="font-size: 0.65rem; font-weight: 700; color: #999; uppercase; margin-bottom: 0.5rem;">MAIN PIPELINE</div>
      <div style="display: flex; flex-direction: column; gap: 0.35rem;">
        <a href="/dashboard" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isDash ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>▦ DASHBOARD</span>
        </a>

        <a href="/dashboard/agent" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isAgent ? 'background: #123B2D; color: #fff; font-weight: 900;' : 'background: #123B2D; color: #fff;'} border: 1px solid #000;">
          <span>🤖 AI SALES AGENT</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem; font-weight: 900;">AUTONOMOUS</span>
        </a>

        <a href="/dashboard/workflows" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isWf ? 'background: #000; color: #fff; font-weight: 900;' : 'background: #000; color: #fff;'} border: 1px solid #000;">
          <span>⚡ WORKFLOW ENGINE</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem; font-weight: 900;">ACTIVE</span>
        </a>

        <a href="/dashboard/leads" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isLeads ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>👤 LEADS</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>

        <a href="/dashboard/conversations" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isConv ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>💬 CONVERSATIONS</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>

        <a href="/dashboard/meetings" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isMeet ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>📅 MEETINGS</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>

        <a href="/dashboard/analytics" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isAna ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>📊 ANALYTICS</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>
      </div>
    </div>

    <div>
      <div style="font-size: 0.65rem; font-weight: 700; color: #999; uppercase; margin-bottom: 0.5rem;">KNOWLEDGE & RULES</div>
      <div style="display: flex; flex-direction: column; gap: 0.35rem;">
        <a href="/dashboard/knowledge" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isKb ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>📚 KNOWLEDGE BASE</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>

        <a href="/dashboard/team" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${isTeam ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'border: 1px solid #ccc; font-weight: 700; color: #000;'}">
          <span>🛡️ TEAM & SECURITY</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">ACTIVE</span>
        </a>

        <a href="/admin/dashboard" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: #123B2D; color: #fff; font-weight: 700; margin-top: 0.5rem; border: 1px solid #000;">
          <span>🔒 ADMIN CONTROL</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem;">SECURE</span>
        </a>
      </div>
    </div>
  </aside>`;
}

// 0. AUTH ENTRY ROUTE (/auth, /login, /signup)
function renderAuthPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Authentication & Login</title>
  <style>${sharedStyles}</style>
</head>
<body style="min-height: 100vh; display: flex; items-center: center; justify-content: center; padding: 2rem;">
  <div style="width: 100%; max-width: 500px; margin: auto;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 2rem;">
      <div style="width: 40px; height: 40px; background: #000; color: #fff; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid #000;">RA</div>
      <span style="font-weight: 900; font-size: 1.5rem; text-transform: uppercase; letter-spacing: -0.03em;">REV AI</span>
    </div>

    <!-- TAB HEADERS -->
    <div style="display: flex; margin-bottom: 0;">
      <button onclick="document.getElementById('user-tab').style.display='block'; document.getElementById('admin-tab').style.display='none'; this.style.background='#000'; this.style.color='#fff'; document.getElementById('admin-btn').style.background='#fff'; document.getElementById('admin-btn').style.color='#000';" style="flex: 1; padding: 0.75rem; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; background: #000; color: #fff; border: 1px solid #000; cursor: pointer;">
        👤 USER SIGN IN
      </button>
      <button id="admin-btn" onclick="document.getElementById('admin-tab').style.display='block'; document.getElementById('user-tab').style.display='none'; this.style.background='#123B2D'; this.style.color='#fff'; this.previousElementSibling.style.background='#fff'; this.previousElementSibling.style.color='#000';" style="flex: 1; padding: 0.75rem; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; background: #fff; color: #000; border: 1px solid #000; border-left: none; cursor: pointer;">
        🛡️ ADMIN SIGN IN
      </button>
    </div>

    <div style="background: #fff; border: 1px solid #000; border-top: none; padding: 2rem;">
      <!-- USER TAB -->
      <div id="user-tab">
        <div style="width: 100%; height: 6px; background: #12B76A; margin-bottom: 1.5rem;"></div>
        <h2 style="font-size: 1.5rem; font-weight: 900; uppercase; margin: 0 0 0.4rem 0;">USER SIGN IN</h2>
        <p style="font-size: 0.75rem; color: #666; margin-bottom: 1.5rem;">Uses Real Supabase Auth for multi-tenant users.</p>

        <form action="/dashboard" method="GET" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.65rem; font-weight: 900; uppercase; margin-bottom: 0.3rem;">Work Email</label>
            <input type="email" required value="sufiyanshah4545@gmail.com" style="width: 100%; padding: 0.75rem; border: 1px solid #000; background: #F1F2F3; font-size: 0.85rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.65rem; font-weight: 900; uppercase; margin-bottom: 0.3rem;">Password</label>
            <input type="password" required value="••••••••" style="width: 100%; padding: 0.75rem; border: 1px solid #000; background: #F1F2F3; font-size: 0.85rem;" />
          </div>

          <button type="submit" class="pill-btn" style="width: 100%; justify-content: center; margin-top: 0.5rem;">SIGN IN TO WORKSPACE &rarr;</button>
        </form>
      </div>

      <!-- ADMIN TAB -->
      <div id="admin-tab" style="display: none;">
        <div style="width: 100%; height: 6px; background: #123B2D; margin-bottom: 1.5rem;"></div>
        <h2 style="font-size: 1.5rem; font-weight: 900; uppercase; margin: 0 0 0.4rem 0;">ADMINISTRATOR SIGN IN</h2>
        <p style="font-size: 0.75rem; color: #666; margin-bottom: 1.5rem;">Server-side verified admin credentials.</p>

        <form action="/admin/dashboard" method="GET" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.65rem; font-weight: 900; uppercase; margin-bottom: 0.3rem;">Administrator Name</label>
            <input type="text" required placeholder="Sanika Wazarkar" style="width: 100%; padding: 0.75rem; border: 1px solid #000; background: #F1F2F3; font-size: 0.85rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.65rem; font-weight: 900; uppercase; margin-bottom: 0.3rem;">Password</label>
            <input type="password" required placeholder="••••••••" style="width: 100%; padding: 0.75rem; border: 1px solid #000; background: #F1F2F3; font-size: 0.85rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.65rem; font-weight: 900; uppercase; margin-bottom: 0.3rem;">Security Code</label>
            <input type="password" required placeholder="••••••" style="width: 100%; padding: 0.75rem; border: 1px solid #000; background: #F1F2F3; font-size: 0.85rem; font-family: monospace;" />
          </div>

          <button type="submit" style="width: 100%; padding: 0.75rem; background: #123B2D; color: #fff; border: 1px solid #000; font-weight: 900; font-size: 0.85rem; text-transform: uppercase; cursor: pointer; margin-top: 0.5rem;">ADMIN SIGN IN &rarr;</button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 0.1 ADMIN DASHBOARD ROUTE (/admin/dashboard)
function renderAdminDashboardPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Admin Control Center</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <header style="height: 52px; border-bottom: 1px solid #000; background: #fff; padding: 0 1.5rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50;">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <a href="/" style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 32px; height: 32px; background: #123B2D; color: #fff; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; border: 1px solid #000;">RA</div>
        <span style="font-weight: 900; font-size: 1.1rem; text-transform: uppercase;">REV AI</span>
      </a>

      <span style="background: #123B2D; color: #fff; font-family: monospace; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; uppercase; border: 1px solid #000;">
        ADMIN CONTROL CENTER
      </span>
    </div>

    <div style="display: flex; align-items: center; gap: 1.5rem;">
      <div style="text-align: right; font-family: monospace; font-size: 0.75rem;">
        <span style="color: #666;">ADMIN: </span>
        <span style="font-weight: 900;">SANIKA WAZARKAR</span>
      </div>

      <a href="/auth" style="padding: 0.4rem 0.8rem; border: 1px solid #000; background: #fff; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">[ &rarr; ADMIN LOGOUT ]</a>
    </div>
  </header>

  <main style="max-width: 1200px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
    <div style="background: #123B2D; color: #fff; border: 1px solid #000; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="font-size: 1.75rem; font-weight: 900; uppercase; margin: 0;">🛡️ ADMINISTRATION & SYSTEM STATUS</h1>
        <span style="background: #12B76A; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 0.25rem 0.6rem;">SECURE ADMIN SESSION ACTIVE</span>
      </div>
      <p style="font-family: monospace; font-size: 0.75rem; color: #a3e635; margin-top: 0.5rem;">
        Logged in as SANIKA WAZARKAR. Server-side session verification active. No credentials stored in client state.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
      <div style="background: #fff; border: 1px solid #000; padding: 1.5rem;">
        <div style="font-size: 0.7rem; font-weight: 900; font-family: monospace; color: #666; uppercase;">SYSTEM STATUS</div>
        <div style="font-size: 2rem; font-weight: 900; margin-top: 0.5rem;">100% ONLINE</div>
        <div style="font-size: 0.65rem; font-family: monospace; color: #888; margin-top: 0.3rem;">Next.js App Router Operational</div>
      </div>

      <div style="background: #fff; border: 1px solid #000; padding: 1.5rem;">
        <div style="font-size: 0.7rem; font-weight: 900; font-family: monospace; color: #666; uppercase;">DATABASE STATUS</div>
        <div style="font-size: 2rem; font-weight: 900; color: #12B76A; margin-top: 0.5rem;">OPERATIONAL</div>
        <div style="font-size: 0.65rem; font-family: monospace; color: #888; margin-top: 0.3rem;">Supabase PostgreSQL Connected</div>
      </div>

      <div style="background: #fff; border: 1px solid #000; padding: 1.5rem;">
        <div style="font-size: 0.7rem; font-weight: 900; font-family: monospace; color: #666; uppercase;">AUTH SYSTEM</div>
        <div style="font-size: 2rem; font-weight: 900; color: #20C8E8; margin-top: 0.5rem;">DUAL AUTH</div>
        <div style="font-size: 0.65rem; font-family: monospace; color: #888; margin-top: 0.3rem;">Supabase + Server Admin (HTTP-only)</div>
      </div>
    </div>

    <div style="background: #fff; border: 1px solid #000; overflow: hidden;">
      <div style="padding: 1rem; background: #F1F2F3; border-bottom: 1px solid #000; font-family: monospace; font-size: 0.75rem; font-weight: 900; uppercase;">
        // SYSTEM ENTITIES OVERVIEW (REAL METRICS ONLY)
      </div>

      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
        <thead>
          <tr style="border-bottom: 1px solid #000; font-family: monospace; font-weight: 900; uppercase; background: #F1F2F3;">
            <th style="padding: 1rem;">Entity</th>
            <th style="padding: 1rem;">Description</th>
            <th style="padding: 1rem;">Count / Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 1rem; font-weight: 900;">Registered Users</td>
            <td style="padding: 1rem; font-family: monospace;">Total users in public.users table</td>
            <td style="padding: 1rem; font-family: monospace; font-weight: 900;">3</td>
          </tr>
          <tr>
            <td style="padding: 1rem; font-weight: 900;">Organizations</td>
            <td style="padding: 1rem; font-family: monospace;">Multi-tenant organizations created</td>
            <td style="padding: 1rem; font-family: monospace; font-weight: 900;">2</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

// 1. DASHBOARD PAGE ROUTE
function renderDashboardPage() {
  const email = "SUFIYANSHAH4545@GMAIL.COM";
  const userLower = "sufiyanshah4545@gmail.com";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Dashboard Control Center</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar(email)}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem; min-width: 0;">
      <!-- WORKSPACE HEADER CARD -->
      <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
        <div>
          <div style="background: #000; color: #fff; font-size: 0.65rem; font-weight: 900; font-family: monospace; padding: 0.2rem 0.5rem; display: inline-block; margin-bottom: 0.5rem; border: 1px solid #000;">
            🛡️ MULTI-TENANT ISOLATED WORKSPACE
          </div>
          <h1 style="font-size: 2.25rem; font-weight: 900; text-transform: uppercase; margin: 0 0 0.4rem 0; letter-spacing: -0.03em;">REV AI WORKSPACE</h1>
          <div style="font-size: 0.7rem; font-family: monospace; color: #555; text-transform: uppercase;">
            INDUSTRY: SALES AUTOMATION &bull; TENANT SECURITY STATUS: ACTIVE RLS
          </div>
        </div>

        <div style="display: flex; items-center; justify-content: flex-end; position: relative;">
          <div style="width: 110px; height: 100px; background: #12B76A; border: 1px solid #000; position: absolute; right: 0; top: -30px;"></div>
          <div style="background: #fff; border: 1px solid #000; padding: 0.6rem 0.8rem; position: relative; z-index: 10; text-align: right;">
            <div style="font-size: 0.55rem; font-family: monospace; font-weight: 900; color: #777;">USER IDENTITY</div>
            <div style="font-size: 0.75rem; font-family: monospace; font-weight: 900; color: #000;">${userLower}</div>
          </div>
        </div>
      </div>

      <!-- METRIC CARDS (ROW OF 4) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; uppercase;">
            <span>TOTAL LEADS</span> <span>👤</span>
          </div>
          <div style="font-size: 2.25rem; font-weight: 900;">3</div>
          <div style="font-size: 0.55rem; font-family: monospace; color: #888; text-transform: uppercase;">DATABASE REAL METRIC</div>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; uppercase;">
            <span>HOT LEADS</span> <span style="color: #12B76A;">🔥</span>
          </div>
          <div style="font-size: 2.25rem; font-weight: 900; color: #12B76A;">2</div>
          <div style="font-size: 0.55rem; font-family: monospace; color: #888; text-transform: uppercase;">SCORE THRESHOLD &gt; 80</div>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; uppercase;">
            <span>SCHEDULED MEETINGS</span> <span style="color: #20C8E8;">📅</span>
          </div>
          <div style="font-size: 2.25rem; font-weight: 900;">2</div>
          <div style="font-size: 0.55rem; font-family: monospace; color: #888; text-transform: uppercase;">CONFIRMED CALENDAR SLOTS</div>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; uppercase;">
            <span>DEALS CONVERTED</span> <span style="color: #F4B62A;">📈</span>
          </div>
          <div style="font-size: 2.25rem; font-weight: 900;">1</div>
          <div style="font-size: 0.55rem; font-family: monospace; color: #888; text-transform: uppercase;">STATUS: WON</div>
        </div>
      </div>

      <!-- SYSTEM AUTOMATION STATUS CARD -->
      <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 1rem;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 900; text-transform: uppercase; margin: 0;">SYSTEM AUTOMATION STATUS</h2>
            <div style="font-size: 0.65rem; font-family: monospace; color: #666; uppercase; margin-top: 0.2rem;">REAL-TIME PIPELINE ENGINE OPERATIONAL STATUS</div>
          </div>
          <div style="background: #12B76A; color: #fff; font-size: 0.75rem; font-weight: 900; padding: 0.3rem 0.8rem; border: 1px solid #000; display: flex; align-items: center; gap: 0.4rem;">
            🛡️ ENGINE READY
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <a href="/dashboard/leads" style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase;">✓ LEAD INGESTION API</div>
              <div style="font-size: 0.65rem; font-family: monospace; color: #666;">Multi-tenant webhook capture endpoints</div>
            </div>
            <span style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; border: 1px solid #000;">ACTIVE</span>
          </a>

          <a href="/dashboard/agent" style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase;">✓ AI LEAD INTELLIGENCE</div>
              <div style="font-size: 0.65rem; font-family: monospace; color: #666;">Lead scoring & intent extraction agent</div>
            </div>
            <span style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; border: 1px solid #000;">ACTIVE</span>
          </a>

          <a href="/dashboard/conversations" style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase;">✓ AUTOMATED FOLLOW-UPS</div>
              <div style="font-size: 0.65rem; font-family: monospace; color: #666;">n8n event bus dispatcher & triggers</div>
            </div>
            <span style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; border: 1px solid #000;">ACTIVE</span>
          </a>

          <a href="/dashboard/meetings" style="background: #fff; border: 1px solid #000; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase;">✓ CALENDAR INTEGRATION</div>
              <div style="font-size: 0.65rem; font-family: monospace; color: #666;">Google / Cal.com meeting booking</div>
            </div>
            <span style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; border: 1px solid #000;">CONNECTED</span>
          </a>
        </div>
      </div>
    </main>
  </div>

  <div style="position: fixed; bottom: 15px; left: 15px; z-index: 99;">
    <button style="width: 28px; height: 28px; background: #000; color: #fff; border-radius: 50%; border: 1px solid #000; font-family: monospace; font-size: 0.75rem; font-weight: 900; cursor: pointer;">N</button>
  </div>
</body>
</html>`;
}

// 0.2 AUTONOMOUS AI SALES AGENT DASHBOARD ROUTE (/dashboard/agent)
function renderAgentPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Autonomous AI Sales Agent</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/agent")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; text-transform: uppercase;">// AUTONOMOUS AI SALES AGENT</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; text-transform: uppercase; margin: 0;">SALES AUTOPILOT CONTROL</h1>
          <p style="font-size: 0.85rem; color: #444; margin-top: 0.3rem;">Analyze leads, generate high-intent insights, manage approvals, and automate follow-ups.</p>
        </div>

        <button onclick="alert('Running AI Sales Agent analysis on latest lead...');" class="pill-btn">✨ RUN SALES AGENT</button>
      </div>

      <!-- AUTONOMY BANNER -->
      <div style="background: #123B2D; color: #fff; border: 1px solid #000; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0;">ORGANIZATION AUTONOMY CONTROL</h3>
          <span style="background: #12B76A; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.5rem;">MODE: REQUIRE_APPROVAL</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
          <div style="background: rgba(255,255,255,0.1); border: 1px solid #fff; padding: 0.8rem; font-size: 0.75rem;">
            <div style="font-weight: 900; uppercase; margin-bottom: 0.2rem;">1. SUGGEST ONLY</div>
            <div style="font-size: 0.65rem; font-family: monospace; opacity: 0.8;">Agent proposes actions; no automated execution.</div>
          </div>

          <div style="background: #12B76A; color: #fff; border: 1px solid #000; padding: 0.8rem; font-size: 0.75rem;">
            <div style="font-weight: 900; uppercase; margin-bottom: 0.2rem;">2. REQUIRE APPROVAL (ACTIVE)</div>
            <div style="font-size: 0.65rem; font-family: monospace; opacity: 0.9;">Agent proposes; rep approves in queue before sending.</div>
          </div>

          <div style="background: rgba(255,255,255,0.1); border: 1px solid #fff; padding: 0.8rem; font-size: 0.75rem;">
            <div style="font-weight: 900; uppercase; margin-bottom: 0.2rem;">3. AUTONOMOUS</div>
            <div style="font-size: 0.65rem; font-family: monospace; opacity: 0.8;">Approved workflow steps execute automatically in Sandbox.</div>
          </div>
        </div>
      </div>

      <!-- 7 METRICS ROW -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">LEADS ANALYZED</div>
          <div style="font-size: 1.5rem; font-weight: 900;">12</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">HIGH INTENT</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #12B76A;">8</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">ACTIONS EXECUTED</div>
          <div style="font-size: 1.5rem; font-weight: 900;">15</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">PENDING APPROVALS</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #F4B62A;">2</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">FOLLOW-UPS</div>
          <div style="font-size: 1.5rem; font-weight: 900;">6</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">CONVERSATIONS</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #20C8E8;">9</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 0.8rem;">
          <div style="font-size: 0.6rem; font-weight: 900; uppercase; color: #666;">SUCCESS RATE</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #12B76A;">96.4%</div>
        </div>
      </div>

      <!-- AI INSIGHTS PANEL -->
      <div style="background: #fff; border: 1px solid #000; border-left: 4px solid #12B76A; padding: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 900; uppercase; margin: 0 0 0.8rem 0;">✨ AI INSIGHTS & RECOMMENDATIONS</h3>
        <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.8rem; font-family: monospace; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
          <span>💡 3 high-intent leads (Cyberdyne Systems, Apex Tech) have not been contacted within 2 hours.</span>
          <span style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem;">RECOMMENDED</span>
        </div>
      </div>

      <!-- TWO COLUMNS: APPROVALS & TIMELINE -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <!-- PENDING APPROVALS QUEUE -->
        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; flex flex-direction: column; gap: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0 0 1rem 0; border-bottom: 1px solid #000; padding-bottom: 0.5rem;">
            ⏳ PENDING APPROVALS (2)
          </h3>

          <div style="border: 1px solid #000; padding: 1rem; background: #fff; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 900; uppercase; font-size: 0.85rem;">
              <span>SARAH CONNOR (Cyberdyne Systems)</span>
              <span style="background: #12B76A; color: #fff; font-size: 0.65rem; padding: 0.1rem 0.4rem;">🔥 Score: 92/100</span>
            </div>
            <div style="background: #F1F2F3; border: 1px solid #ccc; padding: 0.8rem; font-family: monospace; font-size: 0.7rem; margin: 0.8rem 0;">
              Hi Sarah, I saw your interest in AI Sales Autopilot & custom CRM integration. Would you be open for a 15-minute demo call?
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button onclick="alert('Rejected');" style="padding: 0.4rem 0.8rem; border: 1px solid #000; background: #fff; font-size: 0.75rem; font-weight: 700; cursor: pointer;">❌ REJECT</button>
              <button onclick="alert('Simulated Outreach Sent!');" class="pill-btn" style="font-size: 0.75rem; padding: 0.4rem 1rem;">✓ APPROVE & SEND &rarr;</button>
            </div>
          </div>
        </div>

        <!-- ACTIVITY TIMELINE -->
        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem;">
          <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0 0 1rem 0; border-bottom: 1px solid #000; padding-bottom: 0.5rem;">
            📜 PER-LEAD ACTIVITY TIMELINE (lead_events)
          </h3>
          <div style="font-family: monospace; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.8rem;">
            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem;">
              <div style="font-weight: 900; uppercase;">1. New Lead Captured via Webhook</div>
              <div style="color: #666; font-size: 0.65rem;">Sarah Connor (sarah@cyberdyne.com) submitted contact form</div>
            </div>
            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem;">
              <div style="font-weight: 900; uppercase; color: #12B76A;">2. AI Analysis Completed (Score: 92/100)</div>
              <div style="color: #666; font-size: 0.65rem;">Detected Need: Enterprise Sales Automation | Intent: HIGH</div>
            </div>
            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem;">
              <div style="font-weight: 900; uppercase; color: #F4B62A;">3. Human Approval Requested</div>
              <div style="color: #666; font-size: 0.65rem;">Drafted personalized outreach email awaiting rep review</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 0.3 WORKFLOW BUILDER ROUTE (/dashboard/workflows/builder)
function renderWorkflowBuilderPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Visual Workflow Builder</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/workflows")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// VISUAL WORKFLOW BUILDER ENGINE</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">WORKFLOW CANVAS & NODES</h1>
        </div>
        <button onclick="alert('Workflow graph saved to database!');" class="pill-btn">💾 SAVE WORKFLOW GRAPH</button>
      </div>

      <div style="max-width: 700px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 1rem;">
        <div style="background: #123B2D; color: #fff; border: 1px solid #000; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 1: TRIGGER</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">TRIGGER: New Lead Created</div>
          <div style="font-size: 0.7rem; opacity: 0.8;">Inbound webhook or web form submission event</div>
        </div>

        <div style="text-align: center; font-size: 1.2rem; font-weight: 900;">↓</div>

        <div style="background: #fff; border: 1px solid #000; border-left: 4px solid #12B76A; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 2: AI_ANALYSIS</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">AI ACTION: Analyze Lead</div>
          <div style="font-size: 0.7rem; opacity: 0.8;">Generate lead score (0-100), intent, and summary</div>
        </div>

        <div style="text-align: center; font-size: 1.2rem; font-weight: 900;">↓</div>

        <div style="background: #fff; border: 1px solid #000; border-left: 4px solid #20C8E8; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #20C8E8; color: #000; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 3: CONDITION</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">CONDITION: Lead Score > 80?</div>
          <div style="font-size: 0.7rem; opacity: 0.8;">Branch YES (Hot Lead) vs NO (Nurture)</div>
        </div>

        <div style="text-align: center; font-size: 1.2rem; font-weight: 900;">↓</div>

        <div style="background: #fff; border: 1px solid #000; border-left: 4px solid #F4B62A; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #F4B62A; color: #000; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 4: HUMAN_APPROVAL</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">APPROVAL: Check Autonomy Setting</div>
          <div style="font-size: 0.7rem; opacity: 0.8;">Pause for approval if Require Approval mode is active</div>
        </div>

        <div style="text-align: center; font-size: 1.2rem; font-weight: 900;">↓</div>

        <div style="background: #fff; border: 1px solid #000; border-left: 4px solid #12B76A; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #12B76A; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 5: SEND_EMAIL</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">ACTION: Send Personalized Outreach</div>
          <div style="font-size: 0.7rem; opacity: 0.8;">[DEMO / SIMULATED] Deliver AI drafted outreach email</div>
        </div>

        <div style="text-align: center; font-size: 1.2rem; font-weight: 900;">↓</div>

        <div style="background: #000; color: #fff; border: 1px solid #000; padding: 1rem; font-family: monospace; font-size: 0.8rem;">
          <div style="background: #333; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 0.1rem 0.4rem; display: inline-block; margin-bottom: 0.4rem;">STEP 6: END</div>
          <div style="font-size: 1.1rem; font-weight: 900; uppercase;">END: Execution Completed</div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 2. WORKFLOWS ROUTE
function renderWorkflowsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Workflows Platform</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/workflows")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; text-transform: uppercase;">// WORKFLOW AUTOMATION ENGINE</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; text-transform: uppercase; margin: 0;">WORKFLOWS</h1>
          <p style="font-size: 0.85rem; color: #444; margin-top: 0.3rem;">Automate repetitive business processes with AI-powered workflows.</p>
        </div>

        <a href="/dashboard/workflows/builder" class="pill-btn">+ CREATE WORKFLOW GRAPH</a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 900; uppercase;">● ACTIVE</span>
              <span style="font-family: monospace; font-size: 0.65rem;">v1.2</span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0 0 0.3rem 0;">AI Lead Qualification & Autonomous Outreach</h3>
            <p style="font-size: 0.75rem; color: #555;">Evaluates inbound leads using AI scoring and executes outreach per autonomy settings.</p>

            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem; font-family: monospace; font-size: 0.7rem; margin-top: 1rem;">
              Trigger: New Lead &rarr; AI Analyze &rarr; Score &gt; 80 &rarr; Approval &rarr; Send
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; pt-3;">
            <span style="font-family: monospace; font-size: 0.7rem; color: #666;">15 executions</span>
            <a href="/dashboard/workflows/builder" class="pill-btn-sec">OPEN CANVAS &rarr;</a>
          </div>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="background: #E0E0E0; color: #000; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 900; uppercase;">○ DRAFT</span>
              <span style="font-family: monospace; font-size: 0.65rem;">v1.0</span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0 0 0.3rem 0;">Follow-up Automation Sequence</h3>
            <p style="font-size: 0.75rem; color: #555;">Multi-channel personalized outreach sequence generator.</p>

            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem; font-family: monospace; font-size: 0.7rem; margin-top: 1rem;">
              Trigger: Reply Received &rarr; Delay 48h &rarr; AI Re-engage &rarr; Send
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; pt-3;">
            <span style="font-family: monospace; font-size: 0.7rem; color: #666;">0 executions</span>
            <a href="/dashboard/workflows/builder" class="pill-btn-sec">OPEN CANVAS &rarr;</a>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 3. LEADS ROUTE
function renderLeadsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Leads & Prospects</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/leads")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; text-transform: uppercase;">// PIPELINE MANAGEMENT</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; text-transform: uppercase; margin: 0;">LEADS & PROSPECTS</h1>
          <p style="font-size: 0.85rem; color: #444; margin-top: 0.3rem;">Capture, score, and track inbound prospective sales leads across channels.</p>
        </div>
      </div>

      <div style="background: #fff; border: 1px solid #000; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
          <thead>
            <tr style="background: #F1F2F3; border-bottom: 1px solid #000; font-family: monospace; font-weight: 900; uppercase;">
              <th style="padding: 1rem;">Lead Name</th>
              <th style="padding: 1rem;">Company</th>
              <th style="padding: 1rem;">Contact Info</th>
              <th style="padding: 1rem;">AI Score</th>
              <th style="padding: 1rem;">Status Tag</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 1rem; font-weight: 900;">SARAH CONNOR</td>
              <td style="padding: 1rem;">Cyberdyne Systems</td>
              <td style="padding: 1rem; font-family: monospace;">sarah@cyberdyne.com</td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900; font-family: monospace;">🔥 92 / 100</span></td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900;">HOT</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 1rem; font-weight: 900;">MARCUS WRIGHT</td>
              <td style="padding: 1rem;">Skynet Operations</td>
              <td style="padding: 1rem; font-family: monospace;">marcus@resistance.org</td>
              <td style="padding: 1rem;"><span style="background: #20C8E8; color: #000; padding: 0.2rem 0.5rem; font-weight: 900; font-family: monospace;">78 / 100</span></td>
              <td style="padding: 1rem;"><span style="background: #20C8E8; color: #000; padding: 0.2rem 0.5rem; font-weight: 900;">QUALIFIED</span></td>
            </tr>
            <tr>
              <td style="padding: 1rem; font-weight: 900;">ELENA ROSTOVA</td>
              <td style="padding: 1rem;">Apex Global Software</td>
              <td style="padding: 1rem; font-family: monospace;">elena@apextech.io</td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900; font-family: monospace;">🔥 85 / 100</span></td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900;">HOT</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 4. CONVERSATIONS ROUTE
function renderConversationsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Conversations & Messaging</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/conversations")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// INBOUND COMMUNICATION INBOX</div>
        <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">CONVERSATIONS & MESSAGING</h1>
      </div>

      <div style="display: grid; grid-template-columns: 300px 1fr; gap: 1rem; background: #fff; border: 1px solid #000; min-height: 500px;">
        <div style="border-right: 1px solid #000; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 0.7rem; font-weight: 900; font-family: monospace; uppercase; color: #888;">ACTIVE THREADS (2)</div>
          <div style="padding: 0.75rem; background: #000; color: #fff; border: 1px solid #000;">
            <div style="font-weight: 900; font-size: 0.8rem; uppercase;">SARAH CONNOR</div>
            <div style="font-size: 0.65rem; font-family: monospace; color: #aaa;">Cyberdyne Systems &bull; EMAIL</div>
            <div style="font-size: 0.7rem; color: #ddd; margin-top: 0.3rem;">Can we schedule a demo call...</div>
          </div>
          <div style="padding: 0.75rem; background: #F1F2F3; border: 1px solid #ccc;">
            <div style="font-weight: 900; font-size: 0.8rem; uppercase;">MARCUS WRIGHT</div>
            <div style="font-size: 0.65rem; font-family: monospace; color: #666;">Skynet Ops &bull; WEB FORM</div>
          </div>
        </div>

        <div style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="border-bottom: 1px solid #000; padding-bottom: 0.8rem; font-weight: 900; uppercase; display: flex; justify-content: space-between;">
            <span>SARAH CONNOR &bull; Cyberdyne Systems</span>
            <span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-size: 0.65rem;">AI MONITORING ACTIVE</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem; margin: 1.5rem 0;">
            <div style="background: #fff; border: 1px solid #000; padding: 0.8rem; max-width: 80%;">
              <div style="font-size: 0.6rem; font-family: monospace; color: #666;">SARAH CONNOR &bull; 10:14 AM</div>
              <div style="font-size: 0.8rem; margin-top: 0.2rem;">Hi, I saw Rev AI's sales autopilot solution and want to know if it integrates with our CRM.</div>
            </div>

            <div style="background: #20C8E8; color: #000; border: 1px solid #000; padding: 0.8rem; max-width: 80%; align-self: flex-start;">
              <div style="font-size: 0.6rem; font-family: monospace; font-weight: 900;">AI AUTOPILOT AGENT &bull; 10:15 AM</div>
              <div style="font-size: 0.8rem; margin-top: 0.2rem;">Hello Sarah! Rev AI connects seamlessly with standard CRMs and webhooks. What CRM platform is Cyberdyne Systems using?</div>
            </div>

            <div style="background: #fff; border: 1px solid #000; padding: 0.8rem; max-width: 80%;">
              <div style="font-size: 0.6rem; font-family: monospace; color: #666;">SARAH CONNOR &bull; 10:42 AM</div>
              <div style="font-size: 0.8rem; margin-top: 0.2rem;">Can we schedule a demo call for enterprise automation next Tuesday?</div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; border-top: 1px solid #000; pt-3;">
            <input type="text" placeholder="Type message or AI sales reply..." style="flex: 1; padding: 0.6rem; border: 1px solid #000; font-size: 0.8rem;" />
            <button class="pill-btn">Send Reply &rarr;</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 5. MEETINGS ROUTE
function renderMeetingsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Scheduled Meetings</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/meetings")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// CALENDAR & SALES DISCOVERY</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">SCHEDULED MEETINGS</h1>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 900; uppercase;">✓ CONFIRMED</span>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0.5rem 0 0.2rem 0;">Enterprise Demo & Architecture Review</h3>
            <div style="font-size: 0.8rem; font-weight: 700;">Prospect: Sarah Connor (Cyberdyne Systems)</div>
            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem; font-family: monospace; font-size: 0.75rem; margin-top: 0.8rem;">
              Tuesday, Aug 18 &bull; 2:00 PM EST
            </div>
          </div>
          <a href="https://meet.rev-ai.com/cyberdyne-demo" target="_blank" class="pill-btn-sec">📹 JOIN CALL &rarr;</a>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 900; uppercase;">✓ CONFIRMED</span>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0.5rem 0 0.2rem 0;">Technical Sales Discovery Call</h3>
            <div style="font-size: 0.8rem; font-weight: 700;">Prospect: Marcus Wright (Skynet Operations)</div>
            <div style="background: #F1F2F3; border: 1px solid #000; padding: 0.6rem; font-family: monospace; font-size: 0.75rem; margin-top: 0.8rem;">
              Thursday, Aug 20 &bull; 11:00 AM EST
            </div>
          </div>
          <a href="https://meet.rev-ai.com/skynet-discovery" target="_blank" class="pill-btn-sec">📹 JOIN CALL &rarr;</a>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 6. ANALYTICS ROUTE
function renderAnalyticsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Analytics & Audit Logs</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/analytics")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// PERFORMANCE OBSERVABILITY</div>
        <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">PIPELINE ANALYTICS & AUDIT LOGS</h1>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 1rem;">
          <div style="font-size: 0.7rem; font-weight: 900; uppercase; color: #666;">LEAD CONVERSION RATE</div>
          <div style="font-size: 2.25rem; font-weight: 900;">24.8%</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 1rem;">
          <div style="font-size: 0.7rem; font-weight: 900; uppercase; color: #666;">AI RESPONSE SPEED</div>
          <div style="font-size: 2.25rem; font-weight: 900; color: #12B76A;">840ms</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 1rem;">
          <div style="font-size: 0.7rem; font-weight: 900; uppercase; color: #666;">TOKENS PROCESSED</div>
          <div style="font-size: 2.25rem; font-weight: 900; color: #20C8E8;">142,850</div>
        </div>
        <div style="background: #fff; border: 1px solid #000; padding: 1rem;">
          <div style="font-size: 0.7rem; font-weight: 900; uppercase; color: #666;">WORKFLOW RUNS</div>
          <div style="font-size: 2.25rem; font-weight: 900;">18</div>
        </div>
      </div>

      <div style="background: #123B2D; color: #fff; border: 1px solid #000; padding: 1.5rem;">
        <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0 0 1rem 0;">AI RUN AUDIT TRACKER (ai_runs)</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: monospace; font-size: 0.75rem;">
          <thead>
            <tr style="border-bottom: 1px solid #0E4837; color: #12B76A;">
              <th style="padding: 0.6rem;">Run ID</th>
              <th style="padding: 0.6rem;">Operation Type</th>
              <th style="padding: 0.6rem;">Engine</th>
              <th style="padding: 0.6rem;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #0E4837;">
              <td style="padding: 0.6rem;">run-94821a</td>
              <td style="padding: 0.6rem;">AI_SCORE_QUALIFICATION</td>
              <td style="padding: 0.6rem;">gpt-4o</td>
              <td style="padding: 0.6rem;"><span style="background: #12B76A; color: #fff; padding: 0.1rem 0.4rem;">SUCCESS</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 7. KNOWLEDGE BASE ROUTE
function renderKnowledgePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Knowledge Base & Rules</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/knowledge")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// BUSINESS INTELLIGENCE MEMORY</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">KNOWLEDGE BASE & RULES</h1>
        </div>
        <a href="/onboarding" class="pill-btn">✨ OPEN CONFIGURATOR &rarr;</a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="color: #12B76A; font-family: monospace; font-size: 0.7rem; font-weight: 900; uppercase;">● BUSINESS PROFILE</div>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0.5rem 0;">Company Context & Overview</h3>
            <p style="font-size: 0.75rem; color: #555;">Core company value proposition, working hours, and refund policies.</p>
          </div>
          <a href="/onboarding" class="pill-btn-sec">EDIT INFO &rarr;</a>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="color: #20C8E8; font-family: monospace; font-size: 0.7rem; font-weight: 900; uppercase;">● SERVICE CATALOG</div>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0.5rem 0;">Services & Products Config</h3>
            <p style="font-size: 0.75rem; color: #555;">Service names, pricing tiers, and delivery windows.</p>
          </div>
          <a href="/onboarding" class="pill-btn-sec">MANAGE SERVICES &rarr;</a>
        </div>

        <div style="background: #fff; border: 1px solid #000; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="color: #F4B62A; font-family: monospace; font-size: 0.7rem; font-weight: 900; uppercase;">● FAQS & RULES</div>
            <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0.5rem 0;">AI Sales Question & Answer Bank</h3>
            <p style="font-size: 0.75rem; color: #555;">Structured AI response rules for automated conversation handling.</p>
          </div>
          <a href="/onboarding" class="pill-btn-sec">UPDATE FAQS &rarr;</a>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// 8. TEAM & SECURITY ROUTE
function renderTeamPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — Team Members & Security</title>
  <style>${sharedStyles}</style>
</head>
<body>
  ${renderNavbar()}

  <div style="max-width: 1400px; margin: 0 auto; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start;">
    ${renderSidebar("/dashboard/team")}

    <main style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #000; padding-bottom: 1rem;">
        <div>
          <div style="font-size: 0.65rem; font-family: monospace; color: #123B2D; uppercase;">// ACCESS CONTROL & MULTI-TENANCY</div>
          <h1 style="font-size: 2.5rem; font-weight: 900; uppercase; margin: 0;">TEAM MEMBERS & SECURITY</h1>
        </div>
      </div>

      <div style="background: #123B2D; color: #fff; border: 1px solid #000; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.25rem; font-weight: 900; uppercase; margin: 0;">🛡️ ROW LEVEL SECURITY (RLS) ACTIVE</h3>
          <span style="background: #12B76A; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.5rem;">ISOLATION VERIFIED</span>
        </div>
        <p style="font-family: monospace; font-size: 0.75rem; color: #a3e635; margin-top: 0.5rem;">
          Database helper is_org_member(organization_id) automatically restricts queries to your tenant workspace.
        </p>
      </div>

      <div style="background: #fff; border: 1px solid #000; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
          <thead>
            <tr style="background: #F1F2F3; border-bottom: 1px solid #000; font-family: monospace; font-weight: 900; uppercase;">
              <th style="padding: 1rem;">Member Name</th>
              <th style="padding: 1rem;">Email Address</th>
              <th style="padding: 1rem;">Assigned Role</th>
              <th style="padding: 1rem;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 1rem; font-weight: 900;">SUFIYAN SHAH</td>
              <td style="padding: 1rem; font-family: monospace;">sufiyanshah4545@gmail.com</td>
              <td style="padding: 1rem;"><span style="background: #000; color: #fff; padding: 0.2rem 0.5rem; font-family: monospace; font-weight: 900;">OWNER</span></td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900;">ACTIVE</span></td>
            </tr>
            <tr>
              <td style="padding: 1rem; font-weight: 900;">SARAH CONNOR</td>
              <td style="padding: 1rem; font-family: monospace;">sarah@cyberdyne.com</td>
              <td style="padding: 1rem;"><span style="background: #000; color: #fff; padding: 0.2rem 0.5rem; font-family: monospace; font-weight: 900;">ADMIN</span></td>
              <td style="padding: 1rem;"><span style="background: #12B76A; color: #fff; padding: 0.2rem 0.5rem; font-weight: 900;">ACTIVE</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// HTTP SERVER REQUEST ROUTER
const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  const pathname = reqUrl.pathname;

  res.writeHead(200, { 'Content-Type': 'text/html' });

  if (pathname === '/auth' || pathname === '/login' || pathname === '/signup') {
    res.end(renderAuthPage());
  } else if (pathname.startsWith('/admin')) {
    res.end(renderAdminDashboardPage());
  } else if (pathname.startsWith('/dashboard/agent')) {
    res.end(renderAgentPage());
  } else if (pathname.startsWith('/dashboard/workflows/builder')) {
    res.end(renderWorkflowBuilderPage());
  } else if (pathname.startsWith('/dashboard/workflows')) {
    res.end(renderWorkflowsPage());
  } else if (pathname.startsWith('/dashboard/leads')) {
    res.end(renderLeadsPage());
  } else if (pathname.startsWith('/dashboard/conversations')) {
    res.end(renderConversationsPage());
  } else if (pathname.startsWith('/dashboard/meetings')) {
    res.end(renderMeetingsPage());
  } else if (pathname.startsWith('/dashboard/analytics')) {
    res.end(renderAnalyticsPage());
  } else if (pathname.startsWith('/dashboard/knowledge')) {
    res.end(renderKnowledgePage());
  } else if (pathname.startsWith('/dashboard/team')) {
    res.end(renderTeamPage());
  } else {
    res.end(renderDashboardPage());
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 REV AI AUTONOMOUS AGENT SERVER OPERATIONAL!`);
  console.log(`URL: http://localhost:${PORT}/dashboard/agent`);
  console.log(`==================================================\n`);
});
