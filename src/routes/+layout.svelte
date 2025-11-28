<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  // URL saat ini
  $: currentPath = $page.url.pathname;

  // Halaman yang tidak pakai sidebar (auth pages)
  $: isAuthPage = currentPath === '/login';

  // AUTH store
  $: authState = $auth;

  // Proteksi route: kalau buka halaman selain /login tapi belum login → lempar ke /login
  $: if (browser && !isAuthPage) {
    if (!authState.token) {
      goto('/login');
    }
  }

  // Menu aktif
  const isActive = (path: string) => currentPath.startsWith(path);
</script>

{#if isAuthPage}
  <!-- Halaman login: tanpa sidebar, tanpa topbar, cuma konten -->
  <slot />
{:else}
  <!-- Layout utama dengan sidebar -->
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <div class="flex min-h-screen">
      <!-- SIDEBAR -->
      <aside
        class="hidden w-60 flex-col border-r border-slate-200 bg-white px-3 py-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/90 md:flex"
      >
        <div class="mb-6">
          <div class="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-200">
            Expense Tracker
          </div>
          {#if authState.user}
            <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {authState.user.name}
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[140px]">
              {authState.user.email}
            </div>
          {/if}
        </div>

        <nav class="space-y-1">
          <a
            href="/dashboard"
            class="flex items-center rounded-lg px-3 py-2 text-xs font-medium transition
                   {isActive('/dashboard')
                     ? 'bg-slate-900 text-white'
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
          >
            <span class="mr-2 text-[13px]">📊</span>
            <span>Dashboard</span>
          </a>

          <a
            href="/categories"
            class="flex items-center rounded-lg px-3 py-2 text-xs font-medium transition
                   {isActive('/categories')
                     ? 'bg-slate-900 text-white'
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
          >
            <span class="mr-2 text-[13px]">🏷️</span>
            <span>Kategori</span>
          </a>

          <a
            href="/transactions"
            class="flex items-center rounded-lg px-3 py-2 text-xs font-medium transition
                   {isActive('/transactions')
                     ? 'bg-slate-900 text-white'
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
          >
            <span class="mr-2 text-[13px]">💸</span>
            <span>Transaksi</span>
          </a>
        </nav>

        <div class="mt-auto flex items-center justify-between pt-6 text-[10px] text-slate-400">
          <p>v1.0.0 • Bayu Widia Santoso</p>
          {#if authState.user}
            <button
              type="button"
              class="rounded px-2 py-1 text-[10px] text-rose-500 hover:bg-rose-50"
              on:click={() => {
                auth.logout();
                if (browser) goto('/login');
              }}
            >
              Logout
            </button>
          {/if}
        </div>
      </aside>

      <!-- MAIN AREA -->
      <div class="flex flex-1 flex-col">
        <!-- TOPBAR MOBILE -->
        <header
          class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/90  shadow-sm md:hidden"
        >
          <div>
            <div class="text-xs font-semibold tracking-tight text-slate-700">
              Expense Tracker
            </div>
            {#if authState.user}
              <div class="mt-0.5 text-[11px] text-slate-500">
                {authState.user.name}
              </div>
            {/if}
          </div>
        </header>

        <!-- KONTEN HALAMAN -->
        <main class="flex-1">
          <slot />
        </main>
      </div>
    </div>
  </div>
{/if}
