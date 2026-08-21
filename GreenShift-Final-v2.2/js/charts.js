/**
 * GreenShift v2.0 — Charts Manager
 */

const ChartsManager = {
  instances: {},

  render(results) {
    this.renderScopeChart(results);
    this.renderTopSourcesChart(results);
  },

  renderScopeChart(results) {
    const ctx = document.getElementById('scopeChart');
    if (!ctx) return;

    if (this.instances.scopeChart) {
      this.instances.scopeChart.destroy();
    }

    this.instances.scopeChart = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Scope 1 (Trực tiếp)', 'Scope 2 (Gián tiếp)', 'Scope 3 (Chuỗi giá trị)'],
        datasets: [{
          data: [results.scope1, results.scope2, results.scope3],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} tCO₂e`
            }
          }
        },
        cutout: '60%'
      }
    });
  },

  renderTopSourcesChart(results) {
    const ctx = document.getElementById('topSourcesChart');
    if (!ctx) return;

    if (this.instances.topSourcesChart) {
      this.instances.topSourcesChart.destroy();
    }

    // Sort all breakdown items by emission descending
    const sorted = [...results.breakdown]
      .filter(i => i.emission > 0)
      .sort((a, b) => b.emission - a.emission)
      .slice(0, 5); // Top 5

    this.instances.topSourcesChart = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: sorted.map(i => i.source),
        datasets: [{
          label: 'Phát thải (tCO₂e)',
          data: sorted.map(i => i.emission),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
};

window.ChartsManager = ChartsManager;
