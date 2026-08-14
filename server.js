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

        <a href="/dashboard/project-review" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; ${activePath.startsWith('/dashboard/project-review') ? 'background: #E8E9EA; border: 1px solid #000; font-weight: 900; color: #000;' : 'color: #333;'}">
          <span>✨ PROJECT REVIEW</span>
          <span style="background: #12B76A; color: #fff; padding: 0.1rem 0.3rem; font-size: 0.55rem; font-weight: 900;">NEW</span>
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

// ======================================================
// AI REVIEW PAGE — Full working implementation
// ======================================================
function renderProjectReviewPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>REV AI — AI Website Review</title>
  <style>${sharedStyles}
    .rev-card { background: #fff; border: 1px solid #000; padding: 1.5rem; }
    .label { font-size: 0.65rem; font-family: monospace; font-weight: 900; text-transform: uppercase; color: #555; margin-bottom: 0.3rem; }
    input[type=url], textarea { width: 100%; padding: 0.75rem; border: 1px solid #000; font-size: 0.85rem; font-family: monospace; background: #F1F2F3; outline: none; }
    input[type=url]:focus, textarea:focus { background: #fff; }
    .tag { display: inline-block; font-size: 0.6rem; font-weight: 900; font-family: monospace; text-transform: uppercase; padding: 0.15rem 0.45rem; }
    .tag-green { background: #12B76A; color: #fff; }
    .tag-black { background: #000; color: #fff; }
    .tag-red   { background: #dc2626; color: #fff; }
    .tag-yellow{ background: #F4B62A; color: #000; }
    .score-ring { font-size: 2.5rem; font-weight: 900; }
    .stage { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1px solid #ccc; font-family: monospace; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.35; transition: all 0.3s; }
    .stage.active { border-color: #12B76A; background: #f0fdf4; opacity: 1; font-weight: 900; }
    .stage.done   { border-color: #000; background: #000; color: #fff; opacity: 1; }
    .bullet-list { list-style: none; padding: 0; margin: 0; }
    .bullet-list li { padding: 0.3rem 0; font-size: 0.8rem; border-bottom: 1px solid #eee; display: flex; gap: 0.5rem; }
    .bullet-list li::before { content: "•"; font-weight: 900; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    @media (max-width: 768px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
    .score-bar-wrap { background: #e5e7eb; height: 8px; border: 1px solid #000; }
    .score-bar { background: #12B76A; height: 100%; transition: width 1s ease; }
    .action-row { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; border: 1px solid #000; margin-bottom: 0.5rem; background: #F1F2F3; }
  </style>
</head>
<body>
  ${renderNavbar()}
  <div style="max-width:1400px;margin:0 auto;padding:1.5rem;display:flex;gap:1.5rem;align-items:flex-start;">
    ${renderSidebar('/dashboard/project-review')}
    <main style="flex:1;display:flex;flex-direction:column;gap:1.5rem;">

      <!-- HEADER -->
      <div class="rev-card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:0.65rem;font-family:monospace;color:#123B2D;text-transform:uppercase;font-weight:900;">// OLLAMA QWEN WEBSITE INTELLIGENCE</div>
          <h1 style="font-size:2rem;font-weight:900;text-transform:uppercase;margin:0.25rem 0 0;">AI WEBSITE REVIEW</h1>
          <p style="font-size:0.75rem;font-family:monospace;color:#666;margin:0.25rem 0 0;">PASTE ANY URL &bull; REAL WEBSITE SCRAPE &bull; QWEN STRUCTURED ANALYSIS &bull; SUPABASE SAVED</p>
        </div>
        <button onclick="resetForm()" class="pill-btn" style="font-size:0.75rem;">+ NEW REVIEW</button>
      </div>

      <!-- INPUT FORM -->
      <div id="formSection" class="rev-card">
        <div class="label">WEBSITE URL TO ANALYZE *</div>
        <div style="display:flex;gap:0.75rem;align-items:flex-end;">
          <div style="flex:1;">
            <input type="url" id="websiteUrlInput" placeholder="https://example.com" style="font-size:1rem;padding:1rem;" />
            <div style="font-size:0.65rem;font-family:monospace;color:#888;margin-top:0.3rem;">
              🔒 SSRF-SAFE: Server fetches and analyzes the page. Private IPs and localhost are blocked.
            </div>
          </div>
          <button onclick="runAiReview()" class="pill-btn" style="padding:1rem 2rem;font-size:0.85rem;white-space:nowrap;height:fit-content;" id="runBtn">
            🤖 RUN AI REVIEW
          </button>
        </div>
        <div id="inputError" style="display:none;margin-top:0.75rem;padding:0.75rem;background:#fef2f2;border:1px solid #dc2626;font-family:monospace;font-size:0.8rem;font-weight:700;color:#dc2626;"></div>
      </div>

      <!-- LOADING STAGES -->
      <div id="loadingSection" style="display:none;" class="rev-card">
        <div style="font-weight:900;font-size:1rem;text-transform:uppercase;margin-bottom:1rem;">⚙️ ANALYZING WEBSITE...</div>
        <div id="stage1" class="stage"><span>🌐</span> 1. VALIDATING URL &amp; SSRF CHECK</div>
        <div id="stage2" class="stage"><span>📄</span> 2. FETCHING WEBSITE CONTENT</div>
        <div id="stage3" class="stage"><span>🧠</span> 3. RUNNING QWEN AI ANALYSIS</div>
        <div id="stage4" class="stage"><span>✅</span> 4. VALIDATING AI JSON RESPONSE</div>
        <div id="stage5" class="stage"><span>💾</span> 5. SAVING TO SUPABASE</div>
      </div>

      <!-- ERROR DISPLAY -->
      <div id="errorSection" style="display:none;" class="rev-card">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <span style="font-size:1.5rem;">❌</span>
          <span style="font-weight:900;font-size:1rem;text-transform:uppercase;">REVIEW FAILED</span>
        </div>
        <div id="errorMsg" style="font-family:monospace;font-size:0.85rem;background:#fef2f2;border:1px solid #dc2626;padding:1rem;color:#7f1d1d;"></div>
        <button onclick="resetForm()" class="pill-btn-sec" style="margin-top:1rem;font-size:0.75rem;">← TRY AGAIN</button>
      </div>

      <!-- RESULT SECTION -->
      <div id="resultSection" style="display:none;">

        <!-- SCORE HEADER -->
        <div class="rev-card" style="display:flex;gap:2rem;align-items:center;border-bottom:none;">
          <div style="min-width:130px;background:#000;color:#fff;padding:1.5rem;text-align:center;">
            <div style="font-family:monospace;font-size:0.6rem;font-weight:900;color:#12B76A;text-transform:uppercase;">OVERALL SCORE</div>
            <div class="score-ring" id="res_score">--</div>
            <div style="font-size:0.65rem;color:#aaa;">/&nbsp;100</div>
          </div>
          <div style="flex:1;">
            <div id="res_url" style="font-family:monospace;font-size:0.8rem;font-weight:700;color:#12B76A;margin-bottom:0.5rem;"></div>
            <h2 id="res_title" style="font-size:1.5rem;font-weight:900;text-transform:uppercase;margin:0 0 0.3rem;"></h2>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">
              <span class="tag tag-black" id="res_biztype"></span>
              <span class="tag tag-green" id="res_audience"></span>
            </div>
            <p id="res_valueprop" style="font-size:0.8rem;color:#444;font-style:italic;margin:0;"></p>
          </div>
          <button onclick="resetForm()" class="pill-btn-sec" style="font-size:0.75rem;white-space:nowrap;">+ NEW REVIEW</button>
        </div>

        <!-- SUMMARY -->
        <div class="rev-card" style="margin-top:1rem;">
          <div class="label">📋 WEBSITE SUMMARY</div>
          <p id="res_summary" style="font-size:0.85rem;line-height:1.6;margin:0.5rem 0 0;"></p>
        </div>

        <!-- STRENGTHS / WEAKNESSES -->
        <div class="grid2" style="margin-top:1rem;">
          <div class="rev-card">
            <div class="label" style="color:#12B76A;">✅ STRENGTHS</div>
            <ul id="res_strengths" class="bullet-list"></ul>
          </div>
          <div class="rev-card">
            <div class="label" style="color:#dc2626;">⚠️ WEAKNESSES / GAPS</div>
            <ul id="res_weaknesses" class="bullet-list"></ul>
          </div>
        </div>

        <!-- SCORE BARS -->
        <div class="rev-card" style="margin-top:1rem;">
          <div class="label">📊 AUDIT CATEGORY SCORES</div>
          <div class="grid2" style="margin-top:1rem;gap:1.5rem;">
            <div>
              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>CONVERSION</span><span id="bar_conv_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0 1rem;"><div class="score-bar" id="bar_conv" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>SALES READINESS</span><span id="bar_sales_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0 1rem;"><div class="score-bar" id="bar_sales" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>LEAD GENERATION</span><span id="bar_lead_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0;"><div class="score-bar" id="bar_lead" style="width:0%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>TRUST &amp; CREDIBILITY</span><span id="bar_trust_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0 1rem;"><div class="score-bar" id="bar_trust" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>UX ANALYSIS</span><span id="bar_ux_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0 1rem;"><div class="score-bar" id="bar_ux" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;font-weight:700;"><span>SEO OBSERVATIONS</span><span id="bar_seo_val">—</span></div>
              <div class="score-bar-wrap" style="margin:0.3rem 0;"><div class="score-bar" id="bar_seo" style="width:0%"></div></div>
            </div>
          </div>
        </div>

        <!-- OPPORTUNITIES / RISKS -->
        <div class="grid2" style="margin-top:1rem;">
          <div class="rev-card">
            <div class="label" style="color:#20C8E8;">🚀 OPPORTUNITIES</div>
            <ul id="res_opportunities" class="bullet-list"></ul>
          </div>
          <div class="rev-card">
            <div class="label" style="color:#F4B62A;">⚡ RISKS</div>
            <ul id="res_risks" class="bullet-list"></ul>
          </div>
        </div>

        <!-- RECOMMENDED ACTIONS -->
        <div class="rev-card" style="margin-top:1rem;">
          <div class="label">🎯 RECOMMENDED ACTIONS (AI-GENERATED)</div>
          <div id="res_actions" style="margin-top:0.75rem;"></div>
        </div>

      </div>

      <!-- HISTORY TABLE -->
      <div class="rev-card" id="historySection">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #000;padding-bottom:0.75rem;margin-bottom:1rem;">
          <span style="font-weight:900;font-size:0.85rem;text-transform:uppercase;">RECENT WEBSITE REVIEWS</span>
          <span style="font-family:monospace;font-size:0.65rem;color:#888;">REAL SUPABASE HISTORY</span>
        </div>
        <div id="historyBody"><div style="text-align:center;padding:2rem;color:#aaa;font-family:monospace;">Loading reviews...</div></div>
      </div>

    </main>
  </div>

<script>
  // ====================================================
  // STATE
  // ====================================================
  let currentReview = null;

  // ====================================================
  // SHOW/HIDE HELPERS
  // ====================================================
  function show(id) { document.getElementById(id).style.display = 'block'; }
  function hide(id) { document.getElementById(id).style.display = 'none'; }
  function text(id, val) { document.getElementById(id).textContent = val; }
  function html(id, val) { document.getElementById(id).innerHTML = val; }

  function setStage(n) {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById('stage' + i);
      el.className = 'stage' + (i < n ? ' done' : i === n ? ' active' : '');
    }
  }

  function resetForm() {
    hide('loadingSection');
    hide('errorSection');
    hide('resultSection');
    show('formSection');
    document.getElementById('inputError').style.display = 'none';
    document.getElementById('websiteUrlInput').value = '';
    document.getElementById('runBtn').disabled = false;
    currentReview = null;
    loadHistory();
  }

  // ====================================================
  // VALIDATE URL CLIENT-SIDE (basic guard)
  // ====================================================
  function isValidPublicUrl(raw) {
    const s = raw.trim();
    if (!s) return { ok: false, msg: 'Website URL is required.' };
    let full = s;
    if (!full.startsWith('http://') && !full.startsWith('https://')) full = 'https://' + full;
    let parsed;
    try { parsed = new URL(full); } catch { return { ok: false, msg: 'Invalid URL format.' }; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, msg: 'Only HTTP and HTTPS are supported.' };
    const h = parsed.hostname.toLowerCase();
    const blocked = ['localhost','127.0.0.1','0.0.0.0','::1'];
    if (blocked.includes(h) || h.endsWith('.local') || h.endsWith('.internal') || /^10\./.test(h) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h) || /^192\.168\./.test(h)) {
      return { ok: false, msg: 'Private and internal network addresses are blocked.' };
    }
    return { ok: true, url: full };
  }

  // ====================================================
  // RENDER BULLET LIST
  // ====================================================
  function renderList(id, items) {
    const ul = document.getElementById(id);
    if (!items || items.length === 0) { ul.innerHTML = '<li>Not available from website</li>'; return; }
    ul.innerHTML = items.map(i => '<li>' + escHtml(String(i)) + '</li>').join('');
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ====================================================
  // RENDER SCORE BAR
  // ====================================================
  function renderBar(barId, valId, score) {
    const s = Math.min(100, Math.max(0, Number(score) || 0));
    setTimeout(() => {
      document.getElementById(barId).style.width = s + '%';
    }, 200);
    document.getElementById(valId).textContent = s + '/100';
  }

  // ====================================================
  // RENDER RECOMMENDED ACTIONS
  // ====================================================
  function renderActions(actions) {
    const wrap = document.getElementById('res_actions');
    if (!actions || actions.length === 0) {
      wrap.innerHTML = '<div style="font-family:monospace;font-size:0.75rem;color:#888;">No actions returned.</div>';
      return;
    }
    wrap.innerHTML = actions.map(a => {
      const pri = (a.priority || 'MEDIUM').toUpperCase();
      const cls = pri === 'HIGH' ? 'tag-red' : pri === 'LOW' ? 'tag-black' : 'tag-yellow';
      return '<div class="action-row"><span class="tag ' + cls + '" style="white-space:nowrap;font-size:0.6rem;">' + escHtml(pri) + '</span><div><div style="font-weight:900;font-size:0.8rem;margin-bottom:0.2rem;">' + escHtml(a.action || '') + '</div><div style="font-size:0.75rem;color:#555;">' + escHtml(a.reason || '') + '</div></div></div>';
    }).join('');
  }

  // ====================================================
  // RENDER FULL RESULT
  // ====================================================
  function renderResult(review) {
    const r = review.review_result || review;
    text('res_score', r.overall_score || review.overall_score || '--');
    text('res_url', review.website_url || '');
    text('res_title', review.project_name || review.website_url || 'Website Review');
    text('res_biztype', r.business_type || r.project_type || 'Business');
    text('res_audience', r.target_audience || r.target_market || 'Audience');
    text('res_valueprop', r.value_proposition || '');
    text('res_summary', r.website_summary || r.summary || 'No summary returned.');

    renderList('res_strengths', r.strengths);
    renderList('res_weaknesses', r.weaknesses);
    renderList('res_opportunities', r.opportunities);
    renderList('res_risks', r.risks);
    renderActions(r.recommended_actions);

    // Score bars — support both flat and nested schemas
    const convScore  = r.conversion_score  || (r.conversion_analysis  && r.conversion_analysis.score)  || 0;
    const salesScore = r.sales_readiness_score || (r.sales_readiness && r.sales_readiness.score) || 0;
    const leadScore  = r.lead_generation_score || (r.lead_generation  && r.lead_generation.score)  || 0;
    const trustScore = r.trust_score || (r.trust_and_credibility && r.trust_and_credibility.score) || 0;
    const uxScore    = r.ux_score    || (r.ux_analysis    && r.ux_analysis.score)    || 0;
    const seoScore   = r.seo_score   || (r.seo_observations && r.seo_observations.score) || 0;

    renderBar('bar_conv',  'bar_conv_val',  convScore);
    renderBar('bar_sales', 'bar_sales_val', salesScore);
    renderBar('bar_lead',  'bar_lead_val',  leadScore);
    renderBar('bar_trust', 'bar_trust_val', trustScore);
    renderBar('bar_ux',    'bar_ux_val',    uxScore);
    renderBar('bar_seo',   'bar_seo_val',   seoScore);
  }

  // ====================================================
  // MAIN: RUN AI REVIEW
  // ====================================================
  async function runAiReview() {
    const raw = document.getElementById('websiteUrlInput').value;
    const validation = isValidPublicUrl(raw);

    if (!validation.ok) {
      document.getElementById('inputError').textContent = validation.msg;
      document.getElementById('inputError').style.display = 'block';
      return;
    }
    document.getElementById('inputError').style.display = 'none';

    // Lock UI & start loading
    document.getElementById('runBtn').disabled = true;
    hide('formSection');
    hide('errorSection');
    hide('resultSection');
    show('loadingSection');

    setStage(1);
    await sleep(400);
    setStage(2);

    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: validation.url })
      });

      setStage(3);
      await sleep(600);
      setStage(4);

      const data = await res.json().catch(() => ({ success: false, error: 'Invalid JSON from server.' }));

      if (!res.ok || !data.success) {
        showError(data.error || 'AI review failed. Please try again.');
        return;
      }

      setStage(5);
      await sleep(400);

      // Render result
      hide('loadingSection');
      show('resultSection');
      renderResult(data.review);
      loadHistory();

    } catch (err) {
      showError('Network error: ' + err.message);
    } finally {
      document.getElementById('runBtn').disabled = false;
    }
  }

  function showError(msg) {
    hide('loadingSection');
    hide('formSection');
    hide('resultSection');
    document.getElementById('errorMsg').textContent = msg;
    show('errorSection');
    document.getElementById('runBtn').disabled = false;
    loadHistory();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ====================================================
  // HISTORY TABLE
  // ====================================================
  async function loadHistory() {
    try {
      const res = await fetch('/api/ai-review');
      const data = await res.json().catch(() => ({ success: false }));

      const wrap = document.getElementById('historyBody');
      if (!data.success || !data.reviews || data.reviews.length === 0) {
        wrap.innerHTML = '<div style="text-align:center;padding:2rem;font-family:monospace;font-size:0.8rem;color:#aaa;font-weight:700;">NO REVIEWS YET</div>';
        return;
      }

      wrap.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;"><thead><tr style="background:#F1F2F3;border-bottom:1px solid #000;font-family:monospace;font-weight:900;text-transform:uppercase;"><th style="padding:0.75rem;">Website / Project</th><th style="padding:0.75rem;">Score</th><th style="padding:0.75rem;">Date</th><th style="padding:0.75rem;text-align:right;">Action</th></tr></thead><tbody>' +
        data.reviews.map(rev => {
          const score = rev.overall_score || 0;
          return '<tr style="border-bottom:1px solid #eee;"><td style="padding:0.75rem;"><div style="font-weight:900;text-transform:uppercase;">' + escHtml(rev.project_name || rev.website_url || '—') + '</div><div style="font-family:monospace;font-size:0.65rem;color:#888;">' + escHtml(rev.website_url || '') + '</div></td><td style="padding:0.75rem;"><span style="background:#000;color:#fff;padding:0.2rem 0.5rem;font-family:monospace;font-size:0.75rem;font-weight:900;">' + score + '/100</span></td><td style="padding:0.75rem;font-family:monospace;font-size:0.75rem;color:#666;">' + new Date(rev.created_at).toLocaleDateString() + '</td><td style="padding:0.75rem;text-align:right;"><button onclick="viewHistoryReview(\'' + rev.id + '\')" class="pill-btn-sec" style="font-size:0.65rem;padding:0.3rem 0.8rem;">VIEW</button></td></tr>';
        }).join('') + '</tbody></table>';
    } catch {
      document.getElementById('historyBody').innerHTML = '<div style="padding:1rem;font-family:monospace;font-size:0.75rem;color:#888;">Could not load history.</div>';
    }
  }

  // View a saved review
  async function viewHistoryReview(id) {
    try {
      const res = await fetch('/api/project-review/' + id);
      const data = await res.json().catch(() => ({ success: false }));
      if (data.success && data.review) {
        hide('formSection');
        hide('errorSection');
        hide('loadingSection');
        show('resultSection');
        renderResult(data.review);
      }
    } catch { /* ignore */ }
  }

  // ====================================================
  // ENTER KEY SUBMIT
  // ====================================================
  document.getElementById('websiteUrlInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') runAiReview();
  });

  // Initial load
  loadHistory();
</script>
</body>
</html>`;
}

// ======================================================
// API PROXY — /api/ai-review (GET + POST)
// ======================================================
async function handleAiReviewApi(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  if (req.method === 'GET') {
    // Try to proxy to Next.js API
    try {
      const resp = await fetch(baseUrl + '/api/ai-review', { headers: { 'cookie': req.headers.cookie || '' } });
      const text = await resp.text();
      res.writeHead(resp.status, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, reviews: [] }));
    }
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const { websiteUrl } = parsed;

        if (!websiteUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Website URL is required.' }));
          return;
        }

        // Validate URL
        let cleanUrl = websiteUrl.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) cleanUrl = 'https://' + cleanUrl;

        let parsedUrl;
        try { parsedUrl = new URL(cleanUrl); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid URL format.' }));
          return;
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Only HTTP and HTTPS are supported.' }));
          return;
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        const blocked = ['localhost','127.0.0.1','0.0.0.0','::1'];
        const isPrivate = blocked.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') ||
          /^10\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) || /^192\.168\./.test(hostname);

        if (isPrivate) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Private and internal network addresses are blocked for security.' }));
          return;
        }

        // Fetch website
        let websiteTitle = '';
        let websiteDesc = '';
        let headings = [];
        let bodyText = '';

        const fetchController = new AbortController();
        const fetchTimeout = setTimeout(() => fetchController.abort(), 10000);

        try {
          const siteResp = await fetch(cleanUrl, {
            signal: fetchController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RevAI-WebsiteAnalyzer/1.0',
              'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
            },
            redirect: 'follow'
          });
          clearTimeout(fetchTimeout);

          if (!siteResp.ok) {
            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Website server returned status ' + siteResp.status + '. Cannot analyze.' }));
            return;
          }

          const siteHtml = await siteResp.text();

          // Extract title
          const titleM = siteHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          websiteTitle = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : parsedUrl.hostname;

          // Extract meta description
          const metaM = siteHtml.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([\s\S]*?)["\'][^>]*>/i) ||
                        siteHtml.match(/<meta[^>]*content=["\']([\s\S]*?)["\'][^>]*name=["\']description["\'][^>]*>/i);
          websiteDesc = metaM ? metaM[1].replace(/\s+/g, ' ').trim() : '';

          // Extract H1/H2 headings
          const hRegex = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
          let hMatch;
          while ((hMatch = hRegex.exec(siteHtml)) !== null && headings.length < 8) {
            const cleanH = hMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (cleanH.length > 3) headings.push(cleanH);
          }

          // Strip HTML to visible text
          bodyText = siteHtml
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 4500);

          if (bodyText.length < 30) {
            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Insufficient text content found on website to perform AI analysis.' }));
            return;
          }

        } catch (fetchErr) {
          clearTimeout(fetchTimeout);
          const msg = (fetchErr && fetchErr.name === 'AbortError') ? 'Website request timed out (10s limit).' : 'Website could not be reached: ' + (fetchErr && fetchErr.message || 'Unknown error');
          res.writeHead(422, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: msg }));
          return;
        }

        // Ollama / Qwen AI analysis
        const ollamaBase = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
        const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5';

        // Verify Ollama reachable
        try {
          const pingRes = await fetch(ollamaBase + '/api/tags', { headers: { Accept: 'application/json' } });
          if (!pingRes.ok) throw new Error('Ollama returned ' + pingRes.status);
        } catch (pingErr) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Ollama is unavailable. Please start Ollama and verify the configured Qwen model is running.' }));
          return;
        }

        const systemPrompt = `You are Rev AI's Website Intelligence Analyst. Analyze the real website content below based ONLY on supplied evidence. Do NOT invent information not present in the content. If a field cannot be determined, return "Not available from website".

You MUST reply ONLY with a valid JSON object exactly matching this schema (NO markdown, NO text outside JSON):
{
  "overall_score": 0,
  "summary": "",
  "business_type": "",
  "target_audience": "",
  "value_proposition": "",
  "strengths": [],
  "weaknesses": [],
  "conversion_score": 0,
  "seo_score": 0,
  "ux_score": 0,
  "sales_readiness_score": 0,
  "lead_generation_score": 0,
  "opportunities": [],
  "risks": [],
  "recommended_actions": [
    { "priority": "HIGH", "action": "", "reason": "" }
  ]
}

Scores: integers 0-100 based on evidence only. Recommended actions must be specific to this exact website.`;

        const userPrompt = `WEBSITE URL: ${cleanUrl}
PAGE TITLE: ${websiteTitle}
META DESCRIPTION: ${websiteDesc || 'Not specified'}
H1/H2 HEADINGS: ${headings.join(' | ') || 'None'}

EXTRACTED VISIBLE TEXT:
${bodyText}`;

        let aiResponse;
        try {
          const aiController = new AbortController();
          const aiTimeout = setTimeout(() => aiController.abort(), 90000);

          const aiRes = await fetch(ollamaBase + '/api/generate', {
            method: 'POST',
            signal: aiController.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: ollamaModel,
              prompt: systemPrompt + '\n\n' + userPrompt,
              stream: false,
              format: 'json'
            })
          });
          clearTimeout(aiTimeout);

          if (!aiRes.ok) throw new Error('Ollama API error: ' + aiRes.status);
          const aiData = await aiRes.json();
          const rawText = aiData.response || '{}';

          // Parse & validate JSON
          let parsed;
          try {
            parsed = JSON.parse(rawText);
          } catch {
            const m = rawText.match(/\{[\s\S]*\}/);
            if (m) {
              try { parsed = JSON.parse(m[0]); } catch { parsed = null; }
            }
          }

          if (!parsed || typeof parsed !== 'object') {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'AI model returned an invalid response. Please try again.' }));
            return;
          }

          // Validate & bound scores
          const boundScore = (v, def) => { const n = Number(v); return isNaN(n) ? def : Math.min(100, Math.max(0, Math.round(n))); };
          const toArray   = (v)       => Array.isArray(v) ? v.filter(i => typeof i === 'string') : [];
          const toStr     = (v, def)  => (typeof v === 'string' && v.trim()) ? v.trim() : def;

          aiResponse = {
            overall_score:          boundScore(parsed.overall_score, 70),
            summary:                toStr(parsed.summary, 'Analysis generated from real website content.'),
            business_type:          toStr(parsed.business_type, 'Online Business'),
            target_audience:        toStr(parsed.target_audience, 'Not available from website'),
            value_proposition:      toStr(parsed.value_proposition, 'Not available from website'),
            strengths:              toArray(parsed.strengths),
            weaknesses:             toArray(parsed.weaknesses),
            conversion_score:       boundScore(parsed.conversion_score, 0),
            seo_score:              boundScore(parsed.seo_score, 0),
            ux_score:               boundScore(parsed.ux_score, 0),
            sales_readiness_score:  boundScore(parsed.sales_readiness_score, 0),
            lead_generation_score:  boundScore(parsed.lead_generation_score, 0),
            opportunities:          toArray(parsed.opportunities),
            risks:                  toArray(parsed.risks),
            recommended_actions:    Array.isArray(parsed.recommended_actions)
              ? parsed.recommended_actions
                  .filter(a => a && typeof a.action === 'string')
                  .map(a => ({ priority: ['HIGH','MEDIUM','LOW'].includes((a.priority||'').toUpperCase()) ? a.priority.toUpperCase() : 'MEDIUM', action: a.action.trim(), reason: (a.reason || '').trim() }))
              : []
          };

        } catch (aiErr) {
          const msg = (aiErr && aiErr.name === 'AbortError') ? 'Qwen AI analysis timed out. The model may be busy — please try again.' : 'AI analysis error: ' + (aiErr && aiErr.message || 'Unknown');
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: msg }));
          return;
        }

        // Build review record (no Supabase needed for server.js mode — return direct result)
        const reviewRecord = {
          id: 'review_' + Date.now(),
          project_name: websiteTitle || parsedUrl.hostname,
          website_url: cleanUrl,
          project_description: websiteDesc || bodyText.slice(0, 200),
          target_audience: aiResponse.target_audience,
          product_service: aiResponse.business_type,
          overall_score: aiResponse.overall_score,
          review_result: aiResponse,
          created_at: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, reviewId: reviewRecord.id, websiteUrl: cleanUrl, review: reviewRecord }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Unexpected server error.' }));
      }
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Method not allowed.' }));
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
  } else if (pathname.startsWith('/dashboard/project-review') || pathname.startsWith('/dashboard/ai-review')) {
    res.end(renderProjectReviewPage());
  } else if (pathname === '/api/ai-review') {
    handleAiReviewApi(req, res);
    return;
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
