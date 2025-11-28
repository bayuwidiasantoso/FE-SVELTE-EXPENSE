<script lang="ts">
  import { onMount } from 'svelte';
  import { API_BASE_URL } from '$lib/config';
  import { auth } from '$lib/stores/auth';

  type TransactionType = 'INCOME' | 'EXPENSE';

  interface Category {
    id: number;
    name: string;
    type: TransactionType;
    userId: number;
  }

  interface CategoryForm {
    id: number | null;
    name: string;
    type: TransactionType;
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
  $: console.log('token =', `${token}`);
  $: console.log('userId =', userId);

  let categories: Category[] = [];
  let loading = false;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  // form state (create / edit)
  let form: CategoryForm = {
    id: null,
    name: '',
    type: 'EXPENSE'
  };

  let isEditing = false;

  async function loadCategories() {
    if (!userId || !token) {
      console.warn('[categories] userId/token belum siap, skip loadCategories');
      return;
    }
    loading = true;
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
      loading = false;
    }
  }

  function resetForm() {
    form = {
      id: null,
      name: '',
      type: 'EXPENSE'
    };
    isEditing = false;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    errorMessage = '';
    successMessage = '';

    if (!form.name) {
      errorMessage = 'Nama kategori wajib diisi';
      saving = false;
      return;
    }

    const payload = {
      name: form.name,
      type: form.type,
      userId
    };

    try {
      let res: Response;

      if (isEditing && form.id != null) {
        res = await fetch(`${API_BASE_URL}/categories/${form.id}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const text = await res.text();
        console.error('Error body:', text);
        throw new Error('Gagal menyimpan kategori');
      }

      await loadCategories();
      resetForm();

      successMessage = isEditing ? 'Kategori berhasil diupdate' : 'Kategori berhasil ditambahkan';
      setTimeout(() => (successMessage = ''), 2000);
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      saving = false;
    }
  }

  function startEdit(category: Category) {
    form = {
      id: category.id,
      name: category.name,
      type: category.type
    };
    isEditing = true;
    errorMessage = '';
    successMessage = '';
  }

  async function deleteCategory(id: number) {
    const confirmDelete = window.confirm('Yakin ingin menghapus kategori ini?');
    if (!confirmDelete) return;

    errorMessage = '';
    successMessage = '';

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE', 
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error body:', text);
        throw new Error('Gagal menghapus kategori');
      }

      await loadCategories();
      successMessage = 'Kategori berhasil dihapus';
      setTimeout(() => (successMessage = ''), 2000);

      // jika kategori yang dihapus sedang di-edit, reset form
      if (form.id === id) {
        resetForm();
      }
    } catch (err: unknown) {
      console.error(err);
      errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
    }
  }

  function typeLabel(type: TransactionType): string {
    return type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
  }

  onMount(() => {
    loadCategories();
  });
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-slate-800">Kategori</h1>
    <p class="text-xs text-slate-500 ">
      Kelola kategori untuk pemasukan dan pengeluaran.
    </p>
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

  <div class="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
    <!-- Form -->
    <section class="rounded-xl bg-white p-5 shadow-sm dark:border dark:border-slate-800 ">
      <h2 class="text-sm font-semibold text-slate-800 ">
        {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
      </h2>
      <p class="mb-4 text-xs text-slate-500 ">
        Kategori digunakan saat mencatat transaksi.
      </p>

      <form class="space-y-3" on:submit|preventDefault={handleSubmit}>
        <div>
          <label class="block text-xs font-medium text-slate-600" for="name">
            Nama kategori
          </label>
          <input
            id="name"
            class="mt-1 w-full rounded-lg  border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500  "
            type="text"
            bind:value={form.name}
            placeholder="Contoh: Makan, Gaji, Transport"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600" for="type">
            Tipe
          </label>
          <select
            id="type"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            bind:value={form.type}
          >
            <option value="EXPENSE">Pengeluaran</option>
            <option value="INCOME">Pemasukan</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            class="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : isEditing ? 'Update Kategori' : 'Simpan Kategori'}
          </button>

          {#if isEditing}
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              on:click={resetForm}
            >
              Batal
            </button>
          {/if}
        </div>
      </form>
    </section>

    <!-- Tabel kategori -->
    <section class="rounded-xl bg-white p-5 shadow-sm dark:border ">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-800">
          {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
        </h2>
        <p class="mb-4 text-xs text-slate-500 ">
          Kategori digunakan saat mencatat transaksi.
        </p>
      </div>

      {#if loading}
        <p class="text-xs text-slate-500">Memuat kategori...</p>
      {:else if categories.length === 0}
        <p class="text-xs text-slate-500">Belum ada kategori.</p>
      {:else}
        <div class="max-h-[420px] overflow-auto rounded-lg border border-slate-100">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Nama</th>
                <th class="px-3 py-2">Tipe</th>
                <th class="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each categories as c}
                <tr class="border-t border-slate-100 hover:bg-slate-50/60">
                  <td class="px-3 py-2 text-sm text-slate-800 ">
                    {c.name}
                  </td>
                  <td class="px-3 py-2 text-xs">
                    {#if c.type === 'INCOME'}
                      <span
                        class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                      >
                        {typeLabel(c.type)}
                      </span>
                    {:else}
                      <span
                        class="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                      >
                        {typeLabel(c.type)}
                      </span>
                    {/if}
                  </td>
                  <td class="px-3 py-2 text-right text-xs">
                    <button
                      class="mr-2 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 text-yellow-600"
                      on:click={() => startEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      class="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 text-red-600"
                      on:click={() => deleteCategory(c.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>
</div>
