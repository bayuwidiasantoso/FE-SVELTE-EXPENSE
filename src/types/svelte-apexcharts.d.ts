declare module 'svelte-apexcharts' {
  import type { SvelteComponentTyped } from 'svelte';

  export default class ApexCharts extends SvelteComponentTyped<{
    options?: any;
    series?: any;
    type?: string;
    width?: number | string;
    height?: number | string;
  }> {}
}
