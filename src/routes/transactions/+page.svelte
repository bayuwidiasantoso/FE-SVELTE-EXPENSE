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

  interface TransactionForm {
    id: number | null;
    amount: string;
    type: TransactionType;
    date: string;
    description: string;
    categoryId: string;
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

  $: console.log('authState =', authState);
  $: console.log('token =', token);
  $: console.log('userId =', userId);

   // Pagination & sorting
  let page = 0;
  let size = 10;
  let totalPages = 0;
  let totalElements = 0;
  let sortBy = 'date';
  let sortDir: 'asc' | 'desc' = 'desc';

  let categories: Category[] = [];
  let transactionsRaw: Transaction[] = [];
  let transactionsFiltered: Transaction[] = [];

  let loading = false;
  let errorMessage = '';
  let successMessage = '';

  // Filter
  let filterFrom = '';
  let filterTo = '';
  let filterType: TransactionType | 'ALL' = 'ALL';
  let filterCategoryId: number | 'ALL' = 'ALL';

  // Modal CRUD
  let showModal = false;
  let isEditing = false;
  let saving = false;
  let form: TransactionForm = {
    id: null,
    amount: '',
    type: 'EXPENSE',
    date: '',
    description: '',
    categoryId: ''
  };

  function resetForm() {
    form = {
      id: null,
      amount: '',
      type: 'EXPENSE',
      date: '',
      description: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : ''
    };
    isEditing = false;
  }

  function openCreateModal() {
    resetForm();
    showModal = true;
  }

  function openEditModal(t: Transaction) {
    form = {
      id: t.id,
      amount: String(t.amount ?? ''),
      type: t.type,
      date: t.date,
      description: t.description ?? '',
      categoryId: t.category ? String(t.category.id) : (categories[0] ? String(categories[0].id) : '')
    };
    isEditing = true;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    saving = false;
  }

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(value);
  }

  function typeLabel(type: TransactionType): string {
    return type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories?userId=${userId}`, {headers});
      if (!res.ok) {
        throw new Error('Gagal mengambil kategori');
      }
      const data: Category[] = await res.json();
      categories = data;

      if (!form.categoryId && categories.length > 0) {
        form.categoryId = String(categories[0].id);
      }
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    }
  }

  async function loadTransactions() {
    loading = true;
    errorMessage = '';

    const params = new URLSearchParams();
    params.set('userId', String(userId));
    params.set('page', String(page));
    params.set('size', String(size));
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);

    if (filterFrom) params.set('from', filterFrom);
    if (filterTo) params.set('to', filterTo);

    try {
      const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {headers});
      if (!res.ok) {
        throw new Error('Gagal mengambil transaksi');
      }

      const data = await res.json();

      // Spring Page<T>
      transactionsRaw = data.content ?? [];
      totalPages = data.totalPages ?? 0;
      totalElements = data.totalElements ?? 0;

      applyFilters();
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    let list = [...transactionsRaw];

    if (filterType !== 'ALL') {
      list = list.filter((t) => t.type === filterType);
    }

    if (filterCategoryId !== 'ALL') {
      list = list.filter((t) => t.category && String(t.category.id) === filterCategoryId);
    }

    transactionsFiltered = list;
  }

  $: if (transactionsRaw.length > 0) {
    applyFilters();
  }

  async function refresh() {
    await loadTransactions();
  }

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm('Yakin ingin menghapus transaksi ini?');
    if (!confirmDelete) return;

    errorMessage = '';
    successMessage = '';

    try {
      const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error body:', text);
        throw new Error('Gagal menghapus transaksi');
      }

      transactionsRaw = transactionsRaw.filter((t) => t.id !== id);
      applyFilters();

      successMessage = 'Transaksi berhasil dihapus';
      setTimeout(() => (successMessage = ''), 2000);
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    errorMessage = '';
    successMessage = '';

    if (!form.amount || !form.date || !form.categoryId) {
      errorMessage = 'Amount, tanggal, dan kategori wajib diisi';
      saving = false;
      return;
    }

    const payload = {
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
      description: form.description || '',
      categoryId: Number(form.categoryId),
      userId
    };

    try {
      let res: Response;

      if (isEditing && form.id != null) {
        res = await fetch(`${API_BASE_URL}/transactions/${form.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const text = await res.text();
        console.error('Error body:', text);
        throw new Error('Gagal menyimpan transaksi');
      }

      await loadTransactions();
      closeModal();

      successMessage = isEditing ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil ditambahkan';
      setTimeout(() => (successMessage = ''), 2000);
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    await loadCategories();
    await loadTransactions();
  });

  function goToPage(newPage: number) {
    if (newPage < 0 || newPage >= totalPages) return;
    page = newPage;
    loadTransactions();
  }

  function nextPage() {
    if (page < totalPages - 1) {
      page++;
      loadTransactions();
    }
  }

  function prevPage() {
    if (page > 0) {
      page--;
      loadTransactions();
    }
  }

  function changePageSize(newSize: number) {
    size = newSize;
    page = 0; // reset ke halaman pertama
    loadTransactions();
  }

   function setSort(field: string) {
    if (sortBy === field) {
      // toggle direction
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortDir = field === 'date' ? 'desc' : 'asc'; // default
    }
    page = 0;
    loadTransactions();
  }

  function sortIndicator(field: string): string {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? '↑' : '↓';
  }

  async function exportExcel() {
    try {
      const params = new URLSearchParams();
      params.set('userId', String(userId));
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);

      const res = await fetch(`${API_BASE_URL}/transactions/export/excel?${params.toString()}`, {headers});
      if (!res.ok) throw new Error('Gagal export Excel');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan export Excel';
    }
  }

  async function importExcelFrontend(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('userId', String(userId));
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/transactions/import/excel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        throw new Error('Gagal import Excel');
      }

      const msg = await res.text();
      successMessage = msg;
      await loadTransactions();
      setTimeout(() => (successMessage = ''), 3000);
    } catch (err) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan import Excel';
    } finally {
      // reset input file
      target.value = '';
    }
  }

  async function downloadTemplateImport() {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/import/template`, {headers});
      if (!res.ok) throw new Error('Gagal download template import');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_transaksi.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      errorMessage =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat download template';
    }
  }


  async function exportPdf() {
    try {
      const params = new URLSearchParams();
      params.set('userId', String(userId));
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);

      const res = await fetch(`${API_BASE_URL}/transactions/export/pdf?${params.toString()}`, {headers});
      if (!res.ok) throw new Error('Gagal export PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan export PDF';
    }
  }
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 ">Transaksi</h1>
      <p class="text-xs text-slate-500">
        Kelola semua transaksi (tambah, edit, hapus, export/import).
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        type="button"
        on:click={exportExcel}
      >
        Export Excel
      </button>
      <button
        class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 "
        type="button"
        on:click={exportPdf}
      >
        Export PDF
      </button>

      <button
        class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 "
        type="button"
        on:click={downloadTemplateImport}
      >
        Download Template Import
      </button>
      <label class="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
        Import Excel
        <input
          type="file"
          accept=".xlsx,.xls"
          class="hidden"
          on:change={importExcelFrontend}
        />
      </label>

      <button
        class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        type="button"
        on:click={openCreateModal}
      >
        + Tambah Transaksi
      </button>
    </div>
  </header>


  {#if errorMessage}
    <div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
      {successMessage}
    </div>
  {/if}

  <!-- Filter bar -->
  <section class="mb-4 rounded-xl bg-white p-4 shadow-sm dark:border ">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-800 ">Filter</h2>
      <button
        class="text-[11px] text-slate-500 hover:text-slate-700"
        type="button"
        on:click={() => {
          filterFrom = '';
          filterTo = '';
          filterType = 'ALL';
          filterCategoryId = 'ALL';
          applyFilters();
        }}
      >
        Reset filter
      </button>
    </div>

    <div class="grid gap-3 md:grid-cols-4">
      <div>
        <label class="block text-[11px] font-medium text-slate-600" for="from">
          Dari tanggal
        </label>
        <input
          id="from"
          type="date"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          bind:value={filterFrom}
        />
      </div>
      <div>
        <label class="block text-[11px] font-medium text-slate-600 " for="to">
          Sampai tanggal
        </label>
        <input
          id="to"
          type="date"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          bind:value={filterTo}
        />
      </div>
      <div>
        <label class="block text-[11px] font-medium text-slate-600" for="type">
          Tipe
        </label>
        <select
          id="type"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          bind:value={filterType}
          on:change={applyFilters}
        >
          <option value="ALL">Semua</option>
          <option value="INCOME">Pemasukan</option>
          <option value="EXPENSE">Pengeluaran</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-medium text-slate-600 " for="category">
          Kategori
        </label>
        <select
          id="category"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          bind:value={filterCategoryId}
          on:change={applyFilters}
        >
          <option value="ALL">Semua</option>
          {#each categories as c}
            <option value={c.id}>{c.name} ({typeLabel(c.type)})</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="mt-3 flex justify-end">
      <button
        type="button"
        class="inline-flex items-center rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-1"
        on:click={refresh}
      >
        Terapkan ke server
      </button>
    </div>
  </section>

  <!-- Tabel transaksi -->
  <section class="rounded-xl bg-white p-5 shadow-sm dark:border ">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-800">Daftar Transaksi</h2>
      <span class="text-[11px] text-slate-500 ">
        {transactionsFiltered.length} transaksi
      </span>
    </div>

    {#if loading}
      <p class="text-xs text-slate-500 ">Memuat transaksi...</p>
    {:else if transactionsFiltered.length === 0}
      <p class="text-xs text-slate-500 ">Tidak ada transaksi dengan filter saat ini.</p>
    {:else}
      <div class="max-h-[480px] overflow-auto rounded-lg border border-slate-100">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th
                class="px-3 py-2 cursor-pointer select-none hover:bg-slate-100"
                on:click={() => setSort('date')}
              >
                Tanggal {sortIndicator('date')}
              </th>
              <th class="px-3 py-2">Deskripsi</th>
              <th class="px-3 py-2">Kategori</th>
              <th
                class="px-3 py-2 cursor-pointer select-none hover:bg-slate-100"
                on:click={() => setSort('type')}
              >
                Tipe {sortIndicator('type')}
              </th>
              <th
                class="px-3 py-2 text-right cursor-pointer select-none hover:bg-slate-100"
                on:click={() => setSort('amount')}
              >
                Amount {sortIndicator('amount')}
              </th>
              <th class="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each transactionsFiltered as t}
              <tr class="border-t border-slate-100 hover:bg-slate-50/60">
                <td class="px-3 py-2 text-xs text-slate-600">{t.date}</td>
                <td class="px-3 py-2 text-sm text-slate-800 ">
                  {t.description ?? '-'}
                </td>
                <td class="px-3 py-2 text-xs text-slate-700 ">
                  {t.category?.name ?? '-'}
                </td>
                <td class="px-3 py-2 text-xs">
                  {#if t.type === 'INCOME'}
                    <span
                      class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    >
                      {typeLabel(t.type)}
                    </span>
                  {:else}
                    <span
                      class="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                    >
                      {typeLabel(t.type)}
                    </span>
                  {/if}
                </td>
                <td class="px-3 py-2 text-right text-sm font-semibold">
                  {formatCurrency(t.amount)}
                </td>
                <td class="px-3 py-2 text-right text-xs">
                  <button
                    class="mr-2 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 text-yellow-600"
                    type="button"
                    on:click={() => openEditModal(t)}
                  >
                    Edit
                  </button>
                  <button
                    class="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 text-red-600"
                    type="button"
                    on:click={() => handleDelete(t.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-3 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-600 sm:flex-row  " >
        <div>
          Halaman {page + 1} dari {totalPages || 1} • Total {totalElements} transaksi
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1">
            <span>Baris per halaman:</span>
            <select
              class="rounded border border-slate-200 px-1 py-0.5 text-[11px]"
              bind:value={size}
              on:change={(e) => changePageSize(Number((e.target as HTMLSelectElement).value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>

          <button
            class="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
            on:click={prevPage}
            disabled={page === 0}
            type="button"
          >
            ‹ Prev
          </button>
          <button
            class="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
            on:click={nextPage}
            disabled={page >= totalPages - 1}
            type="button"
          >
            Next ›
          </button>
        </div>
      </div>
    {/if}
  </section>
</div>

{#if showModal}
  <!-- Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 ">
    <!-- Modal -->
    <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-800">
          {isEditing ? 'Edit Transaksi' : 'Tambah Transaksi'}
        </h2>
        <button
          class="text-sm text-slate-400 hover:text-slate-700"
          type="button"
          on:click={closeModal}
        >
          ✕
        </button>
      </div>

      <form class="space-y-3" on:submit|preventDefault={handleSubmit}>
        <div>
          <label class="block text-[11px] font-medium text-slate-600" for="amount">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            bind:value={form.amount}
            min="0"
            step="100"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-medium text-slate-600" for="type">
              Tipe
            </label>
            <select
              id="type"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              bind:value={form.type}
            >
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-slate-600" for="date">
              Tanggal
            </label>
            <input
              id="date"
              type="date"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              bind:value={form.date}
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-600" for="category">
            Kategori
          </label>
          <select
            id="category"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            bind:value={form.categoryId}
            required
          >
            {#each categories as c}
              <option value={String(c.id)}>{c.name} ({typeLabel(c.type)})</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-600" for="description">
            Deskripsi
          </label>
          <input
            id="description"
            type="text"
            placeholder="Contoh: Makan siang di warung"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            bind:value={form.description}
          />
        </div>

        <div class="mt-3 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            on:click={closeModal}
          >
            Batal
          </button>
          <button
            type="submit"
            class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            disabled={saving}
          >
            {saving
              ? 'Menyimpan...'
              : isEditing
              ? 'Update Transaksi'
              : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
