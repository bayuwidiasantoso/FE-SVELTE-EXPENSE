<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import type { ApexOptions } from 'apexcharts';

  // === Type definitions ===
  type TransactionType = 'INCOME' | 'EXPENSE';

  type Transaction = {
    id: number;
    amount: number;
    type: TransactionType;
    date: string; // "YYYY-MM-DD"
  };

  export let transactions: Transaction[] = [];

  // Dynamic import untuk menghindari "window is not defined"
  let ApexChartsComponent: any = null;
  let mounted = false;

  onMount(async () => {
    if (browser) {
      const mod = await import('svelte-apexcharts');
      ApexChartsComponent = mod.default;
      mounted = true;
    }
  });

  // === Logic agregasi per bulan ===
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des'
  ];

  // Map: "YYYY-MM" -> { income, expense }
  $: monthlyMap = new Map<string, { income: number; expense: number }>();

  $: {
    monthlyMap.clear();
    for (const t of transactions) {
      if (!t.date) continue;
      const ym = t.date.slice(0, 7); // "YYYY-MM"

      if (!monthlyMap.has(ym)) {
        monthlyMap.set(ym, { income: 0, expense: 0 });
      }
      const entry = monthlyMap.get(ym)!;

      if (t.type === 'INCOME') {
        entry.income += t.amount ?? 0;
      } else if (t.type === 'EXPENSE') {
        entry.expense += t.amount ?? 0;
      }
    }
  }

  // Urutkan key bulan
  $: sortedKeys = Array.from(monthlyMap.keys()).sort();

  // Label sumbu X
  $: categories = sortedKeys.map((ym) => {
    const [year, month] = ym.split('-').map((x) => Number(x));
    const label = monthNames[(month || 1) - 1] ?? '?';
    return `${label} ${year}`;
  });

  // Data series
  $: incomeData = sortedKeys.map((key) => monthlyMap.get(key)?.income ?? 0);
  $: expenseData = sortedKeys.map((key) => monthlyMap.get(key)?.expense ?? 0);

  $: series = [
    {
      name: 'Pemasukan',
      data: incomeData
    },
    {
      name: 'Pengeluaran',
      data: expenseData
    }
  ];

  // Konfigurasi chart
  $: options = {
    chart: {
      id: 'monthly-expense-income',
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: '11px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          new Intl.NumberFormat('id-ID', {
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(val)
      }
    },
    legend: {
      position: 'top'
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(val)
      }
    }
  } satisfies ApexOptions;
</script>

{#if mounted && ApexChartsComponent}
  <ApexChartsComponent {options} {series} type="line" height={300} />
{:else}
  <div class="text-xs text-slate-400">Loading chart...</div>
{/if}
