import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { DashboardStats, ProductAnalytics } from '../../models';
import { PinterestConnectionStatusComponent } from 'src/app/shared/pinterest-connection-status/pinterest-connection-status.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink,PinterestConnectionStatusComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly topProducts = signal<ProductAnalytics[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const [stats, products] = await Promise.all([
        this.admin.getDashboardStats(),
        this.admin.getProductAnalytics()
      ]);
      this.stats.set(stats);
      this.topProducts.set(products.slice(0, 8));
    } finally {
      this.loading.set(false);
    }
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  fmt(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n ?? 0);
  }
}
