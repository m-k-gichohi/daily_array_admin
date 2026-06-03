import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Product } from '../../models';


@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule],
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"],

})
export class ProductListComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly deleteTarget = signal<Product | null>(null);

  searchQuery = '';
  filterStatus = 'all';

  

  readonly filtered = computed(() => {
    let list = this.products();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus === 'active') list = list.filter(p => p.is_active);
    if (this.filterStatus === 'hidden') list = list.filter(p => !p.is_active);
    if (this.filterStatus === 'featured') list = list.filter(p => p.is_featured);
    return list;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const products = await this.admin.getAllProducts();
      this.products.set(products);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFeatured(product: Product): Promise<void> {
    await this.admin.toggleFeatured(product.id, !product.is_featured);
    this.products.update(list =>
      list.map(p => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p)
    );
  }

  async toggleActive(product: Product): Promise<void> {
    await this.admin.toggleActive(product.id, !product.is_active);
    this.products.update(list =>
      list.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p)
    );
  }

  confirmDelete(product: Product): void {
    this.deleteTarget.set(product);
  }

  async deleteProduct(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.admin.deleteProduct(target.id);
    this.products.update(list => list.filter(p => p.id !== target.id));
    this.deleteTarget.set(null);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder.jpg';
  }
}
