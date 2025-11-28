<script lang="ts">
  import { onMount } from 'svelte';
  import { API_BASE_URL } from '$lib/config';
  import { auth } from '$lib/stores/auth';
  import { get } from 'svelte/store';


  type TransactionType = 'INCOME' | 'EXPENSE';

  interface Category {
    id: number;
    name: string;
    type: TransactionType;
    userId: number;
  }

  interface Transaction {
    id: number;
    amount: number;
    type: TransactionType;
    date: string;
    description: string | null;
    category?: {
      id: number;
      name: string;
      type: TransactionType;
    };
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }

  let userId: number | null = null;
  let token: string | null = null;
  let headers: HeadersInit = { 'Content-Type': 'application/json' };

  // reaktif ke perubahan store auth
  $: authState = $auth;

  // setiap kali auth berubah, update userId & token
  $: userId = authState?.user?.id ?? null;
  $: token = authState?.token ?? null;

  // headers juga ikut update ketika token berubah
  $: headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };


  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let loadingCategories = false;
  let loadingTransactions = false;
  let errorMessage = '';

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  }

  function formatTypeLabel(type: TransactionType): string {
    return type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
  }

  async function loadCategories() {
    if (!userId) return;
    loadingCategories = true;
    errorMessage = '';
    try {
      const res = await fetch(`${API_BASE_URL}/categories?userId=${userId}`, {headers});
      if (!res.ok) {
        throw new Error('Gagal mengambil kategori');
      }
      const data: Category[] = await res.json();
      categories = data;
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      loadingCategories = false;
    }
  }

  async function loadTransactions() {
    if (!userId) return;
    loadingTransactions = true;
    errorMessage = '';

    try {
      const res = await fetch(`${API_BASE_URL}/transactions?userId=${userId}`, {headers});
      if (!res.ok) {

        throw new Error('Gagal mengambil transaksi');
      }
      const data: Transaction[] = await res.json();
      // sort terbaru dulu
      data.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      transactions = data;
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      loadingTransactions = false;
    }
  }

  $: totalIncome =
    transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  $: totalExpense =
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  $: balance = totalIncome - totalExpense;

  onMount(async () => {
    await loadCategories();
    await loadTransactions();
  });
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
  <header class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 ">Dashboard</h1>
      <p class="text-xs text-slate-500">
        Ringkasan keuangan dan transaksi terbaru. Untuk tambah/edit transaksi, buka menu
        <span class="font-semibold">Transaksi</span>.
      </p>
    </div>
    <div class="mt-2 flex gap-3 sm:mt-0">
      <div class="rounded-lg bg-emerald-50 px-3 py-2 text-xs">
        <p class="text-emerald-700">Total Pemasukan</p>
        <p class="text-sm font-semibold text-emerald-800">
          {formatCurrency(totalIncome)}
        </p>
      </div>
      <div class="rounded-lg bg-rose-50 px-3 py-2 text-xs">
        <p class="text-rose-700">Total Pengeluaran</p>
        <p class="text-sm font-semibold text-rose-800">
          {formatCurrency(totalExpense)}
        </p>
      </div>
      <div class="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-50">
        <p>Saldo</p>
        <p class="text-sm font-semibold">{formatCurrency(balance)}</p>
      </div>
    </div>
  </header>

  {#if errorMessage}
    <div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
      {errorMessage}
    </div>
  {/if}

  <section class="rounded-xl bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-800">Transaksi Terbaru</h2>
      <a
        href="/transactions"
        class="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
      >
        Kelola di halaman Transaksi →
      </a>
    </div>

    {#if loadingTransactions}
      <p class="mt-4 text-xs text-slate-500">Memuat transaksi...</p>
    {:else if transactions.length === 0}
      <p class="mt-4 text-xs text-slate-500">Belum ada transaksi.</p>
    {:else}
      <div class="mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-100">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-3 py-2">Tanggal</th>
              <th class="px-3 py-2">Deskripsi</th>
              <th class="px-3 py-2">Kategori</th>
              <th class="px-3 py-2">Tipe</th>
              <th class="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each transactions.slice(0, 10) as t}
              <tr class="border-t border-slate-100 hover:bg-slate-50/60">
                <td class="px-3 py-2 text-xs text-slate-600">{t.date}</td>
                <td class="px-3 py-2 text-sm text-slate-800">
                  {t.description ?? '-'}
                </td>
                <td class="px-3 py-2 text-xs text-slate-700">
                  {t.category?.name ?? '-'}
                </td>
                <td class="px-3 py-2 text-xs">
                  {#if t.type === 'INCOME'}
                    <span
                      class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    >
                      {formatTypeLabel(t.type)}
                    </span>
                  {:else}
                    <span
                      class="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                    >
                      {formatTypeLabel(t.type)}
                    </span>
                  {/if}
                </td>
                <td class="px-3 py-2 text-right text-sm font-semibold">
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>
