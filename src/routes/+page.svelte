<script lang="ts">
  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };
</script>

<section class="mx-auto flex max-w-5xl flex-col items-center px-4 py-12 text-center">
  <h1 class="text-3xl font-bold text-slate-800">
    Selamat datang di Expense Tracker
  </h1>
  <p class="mt-3 max-w-xl text-sm text-slate-500">
    Aplikasi sederhana untuk mencatat pemasukan dan pengeluaran harian.
  </p>
  <button
    class="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
    on:click={goToDashboard}
  >
    Buka Dashboard
  </button>
</section>
