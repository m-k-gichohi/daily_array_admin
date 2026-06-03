import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
  afterNextRender,
  ElementRef,
  viewChild,
} from "@angular/core";
import { AdminService } from "../../services/admin.service";
import { ProductAnalytics, DailyStat, TrafficSource } from "../../models";

declare const Chart: any;

@Component({
  selector: "app-analytics",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl: "./analytics.component.html",
  styleUrls: ["./analytics.component.css"],
})
export class AnalyticsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly clicksChartRef = viewChild<ElementRef>("clicksChart");
  readonly viewsChartRef = viewChild<ElementRef>("viewsChart");
  readonly sourcesChartRef = viewChild<ElementRef>("sourcesChart");

  readonly clicks = signal<DailyStat[]>([]);
  readonly views = signal<DailyStat[]>([]);
  readonly sources = signal<TrafficSource[]>([]);
  readonly products = signal<ProductAnalytics[]>([]);
  readonly loading = signal(true);

  readonly totalClicks = signal(0);
  readonly totalViews = signal(0);

  readonly sourceColors = [
    "#e63946",
    "#4a3f8c",
    "#b5832a",
    "#1a6b4a",
    "#888888",
    "#1a1a2e",
  ];

  private charts: any[] = [];

  constructor() {
    afterNextRender(() => {
      if (!this.loading()) this.buildCharts();
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const [clicks, views, sources, products] = await Promise.all([
        this.admin.getDailyClicks(),
        this.admin.getDailyViews(),
        this.admin.getTrafficSources(),
        this.admin.getProductAnalytics(),
      ]);
      this.clicks.set(clicks);
      this.views.set(views);
      this.sources.set(sources);
      this.products.set(products);
      this.totalClicks.set(clicks.reduce((s, d) => s + d.count, 0));
      this.totalViews.set(views.reduce((s, d) => s + d.count, 0));
    } finally {
      this.loading.set(false);
      setTimeout(() => this.buildCharts(), 50);
    }
  }

  private buildCharts(): void {
    if (typeof Chart === "undefined") return;

    // Destroy existing
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: "#aaa", maxTicksLimit: 7 },
        },
        y: {
          grid: { color: "#f8f5ef" },
          ticks: { font: { size: 10 }, color: "#aaa" },
          beginAtZero: true,
        },
      },
    };

    // Clicks chart
    const clicksEl = this.clicksChartRef()?.nativeElement;
    if (clicksEl && this.clicks().length) {
      this.charts.push(
        new Chart(clicksEl, {
          type: "line",
          data: {
            labels: this.clicks().map((d) => this.fmtDay(d.day)),
            datasets: [
              {
                data: this.clicks().map((d) => d.count),
                borderColor: "#1a6b4a",
                backgroundColor: "rgba(26,107,74,0.07)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#1a6b4a",
              },
            ],
          },
          options: baseOpts,
        }),
      );
    }

    // Views chart
    const viewsEl = this.viewsChartRef()?.nativeElement;
    if (viewsEl && this.views().length) {
      this.charts.push(
        new Chart(viewsEl, {
          type: "line",
          data: {
            labels: this.views().map((d) => this.fmtDay(d.day)),
            datasets: [
              {
                data: this.views().map((d) => d.count),
                borderColor: "#4a3f8c",
                backgroundColor: "rgba(74,63,140,0.07)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#4a3f8c",
              },
            ],
          },
          options: baseOpts,
        }),
      );
    }

    // Sources pie chart
    const srcEl = this.sourcesChartRef()?.nativeElement;
    if (srcEl && this.sources().length) {
      this.charts.push(
        new Chart(srcEl, {
          type: "doughnut",
          data: {
            labels: this.sources().map((s) => s.source),
            datasets: [
              {
                data: this.sources().map((s) => s.visits),
                backgroundColor: this.sourceColors,
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} visits`,
                },
              },
            },
            cutout: "65%",
          },
        }),
      );
    }
  }

  sourcePercent(visits: number): number {
    const total = this.sources().reduce((s, src) => s + src.visits, 0);
    return total > 0 ? Math.round((visits / total) * 100) : 0;
  }

  estEarnings(p: ProductAnalytics): string {
    const conversions = p.amazon_clicks * 0.05;
    const earnings = conversions * p.price_approx * 0.04;
    return earnings > 0 ? `$${earnings.toFixed(2)}` : "—";
  }

  fmt(n: number): string {
    if (!n) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  fmtDay(day: string): string {
    const d = new Date(day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }
}
