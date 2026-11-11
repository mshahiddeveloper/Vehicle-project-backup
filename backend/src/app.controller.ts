import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service.js';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req?: Request, @Res({ passthrough: true }) res?: Response) {
    const acceptsHtml = req?.headers?.accept && req.headers.accept.includes('text/html');

    if (acceptsHtml && res) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Global Vehicle Rental Marketplace — API Gateway</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <!-- Top Banner -->
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
          🚗
        </div>
        <div>
          <h1 class="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
            Vehicle Rental Marketplace
            <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">Backend v1.0.0</span>
          </h1>
          <p class="text-xs text-slate-400">Enterprise Modular Monolith API Gateway</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="http://localhost:3000" target="_blank" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md shadow-emerald-600/30">
          <span>Open Web App UI</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Content -->
  <main class="max-w-7xl mx-auto px-6 py-10 space-y-8">
    <!-- Live Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Server Status</div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xl font-bold text-white">Online & Healthy</span>
        </div>
        <div class="text-xs text-slate-500 mt-2">Port 3001 · NestJS 12 + Prisma</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Active Country</div>
        <div class="text-xl font-bold text-white flex items-center gap-2">
          <span>🇵🇰 Pakistan</span>
        </div>
        <div class="text-xs text-slate-500 mt-2">PKR · Launch Mode Active</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Web Application</div>
        <div class="text-xl font-bold text-emerald-400">Port 3000</div>
        <div class="text-xs text-slate-500 mt-2">Next.js 14 App Router</div>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Database</div>
        <div class="text-xl font-bold text-white">SQLite dev.db</div>
        <div class="text-xs text-slate-500 mt-2">26 Models Seeded</div>
      </div>
    </div>

    <!-- Quick Navigation to Frontend -->
    <div class="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-2">
        <span class="text-xs font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Full Marketplace Interface</span>
        <h2 class="text-2xl font-extrabold text-white">Web Frontend is Live on Port 3000</h2>
        <p class="text-sm text-slate-300 max-w-2xl">Browse vehicles, filter by city & budget, test direct WhatsApp lead generation, list your car, submit bank proof, or use the Super Admin dashboard.</p>
      </div>
      <a href="http://localhost:3000" target="_blank" class="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 shrink-0">
        <span>Launch Web App</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </a>
    </div>

    <!-- Core API Endpoints Grid -->
    <div>
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        Core Active Endpoints
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/listings" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/listings</div>
          <div class="text-xs text-slate-400 mt-1">Vehicle search, city filters, and pricing</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/platform/config" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/platform/config</div>
          <div class="text-xs text-slate-400 mt-1">Operating mode (PAKISTAN_ONLY vs INTL)</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/catalogue/categories" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/catalogue/categories</div>
          <div class="text-xs text-slate-400 mt-1">Categories, manufacturers and models</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/subscriptions/plans?countryCode=PK" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/subscriptions/plans</div>
          <div class="text-xs text-slate-400 mt-1">Lister & Driver plans (PKR)</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/users/drivers" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/users/drivers</div>
          <div class="text-xs text-slate-400 mt-1">Verified drivers directory</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">GET</span>
            <a href="/api/v1/admin/audit-logs" target="_blank" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">Open ↗</a>
          </div>
          <div class="font-mono text-sm text-white font-semibold">/api/v1/admin/audit-logs</div>
          <div class="text-xs text-slate-400 mt-1">Administrative audit activity trail</div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;
      res.type('html');
      return html;
    }

    return {
      status: 'ok',
      service: 'Global Vehicle Rental & Transportation Marketplace API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'Global Vehicle Rental Marketplace API',
      timestamp: new Date().toISOString(),
    };
  }
}
