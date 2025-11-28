<script lang="ts">
  import { API_BASE_URL } from '$lib/config';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let errorMessage = '';

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    errorMessage = '';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[login] error body:', text);
        throw new Error('Email atau password salah');
      }

      const data = await res.json();
      console.log('[login] response data:', data);

      // PENTING: panggil auth.login di sini
      auth.login(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email
      });

      // cek store setelah login
      // (ini akan kelihatan di console browser)
      // @ts-ignore
      import('svelte/store').then(({ get }) => {
        // optional debug kalau mau
      });

      await goto('/dashboard');
    } catch (err: unknown) {
      console.error('[login] error:', err);
      errorMessage = err instanceof Error ? err.message : 'Gagal login';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-100 ">
  <div
    class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
  >
    <h1 class="mb-1 text-lg font-semibold text-slate-800 ">
      Masuk ke Expense Tracker
    </h1>
    <p class="mb-4 text-xs text-slate-500 ">
      Gunakan email dan password yang sudah terdaftar.
    </p>

    {#if errorMessage}
      <div
        class="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700
               "
      >
        {errorMessage}
      </div>
    {/if}

    <form class="space-y-3" on:submit|preventDefault={handleLogin}>
      <div>
        <label class="block text-[11px] font-medium text-slate-600 " for="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm
                 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                 "
          bind:value={email}
          required
        />
      </div>

      <div>
        <label
          class="block text-[11px] font-medium text-slate-600 "
          for="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm
                 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                 "
          bind:value={password}
          required
        />
      </div>

      <button
        type="submit"
        class="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm
               hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
               disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Masuk...' : 'Masuk'}
      </button>
    </form>

    <!-- Demo Users -->
    <div class="text-xs mt-3 text-gray-500 leading-4 border-t pt-3">
      <p class="font-medium text-gray-700 mb-1">Demo akun:</p>
      <p>Admin → <span class="font-mono">admin@example.com / password</span></p>
    </div>
  </div>
</div>
