import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Category } from '../../models';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="tda-bs-page">

      <!-- Header -->
      <div class="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <p class="tda-bs-eyebrow mb-1">Manage</p>
          <h1 class="tda-bs-title mb-0">Categories</h1>
        </div>
        <button class="btn tda-btn-primary d-flex align-items-center gap-2"
          (click)="openModal()">
          <i class="bi bi-plus-lg"></i> Add category
        </button>
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="row g-3">
          @for (i of [1,2,3,4]; track i) {
            <div class="col-md-6"><div class="tda-skeleton" style="height:120px"></div></div>
          }
        </div>
      } @else if (categories().length === 0) {
        <div class="tda-bs-card p-5 text-center">
          <i class="bi bi-collection fs-1 text-muted mb-3 d-block"></i>
          <p class="text-muted mb-3">No categories yet.</p>
          <button class="btn tda-btn-primary" (click)="openModal()">Add your first category</button>
        </div>
      } @else {
        <div class="row g-3">
          @for (cat of categories(); track cat.id; let i = $index) {
            <div class="col-md-6">
              <div class="tda-cat-card">
                <div class="d-flex align-items-start justify-content-between gap-3">
                  <div class="flex-grow-1 min-width-0">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="tda-cat-num">0{{ i + 1 }}</span>
                      <h3 class="tda-cat-name mb-0">{{ cat.name }}</h3>
                      @if (!cat.is_active) {
                        <span class="tda-badge tda-badge--red">Hidden</span>
                      }
                    </div>
                    <p class="tda-cat-slug mb-2">/categories/{{ cat.slug }}</p>
                    @if (cat.description) {
                      <p class="tda-cat-desc mb-0">{{ cat.description }}</p>
                    }
                  </div>
                  <div class="d-flex gap-2 flex-shrink-0">
                    <button class="tda-icon-btn" (click)="openModal(cat)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="tda-icon-btn tda-icon-btn--danger" (click)="confirmDelete(cat)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- ── MODAL FORM ── -->
    @if (showModal()) {
      <div class="tda-modal-backdrop" (click)="closeModal()">
        <div class="tda-modal tda-modal--lg" (click)="$event.stopPropagation()">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h3 class="tda-modal-title mb-0">
              {{ editingCat() ? 'Edit category' : 'Add category' }}
            </h3>
            <button class="tda-close-btn" (click)="closeModal()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="tda-field-label">Category name *</label>
              <input type="text" class="form-control tda-input"
                [(ngModel)]="form.name" (input)="autoSlug()"
                placeholder="e.g. Best Pillows & Bedding" />
            </div>
            <div class="col-md-6">
              <label class="tda-field-label">URL slug *</label>
              <input type="text" class="form-control tda-input"
                [(ngModel)]="form.slug"
                placeholder="e.g. pillows-bedding" />
              <small class="text-muted" style="font-size:0.75rem">/categories/{{ form.slug || 'your-slug' }}</small>
            </div>
            <div class="col-12">
              <label class="tda-field-label">Description</label>
              <textarea class="form-control tda-input" rows="2"
                [(ngModel)]="form.description"
                placeholder="Short description shown on the category page"></textarea>
            </div>
            <div class="col-12">
              <label class="tda-field-label">Meta description (SEO)</label>
              <textarea class="form-control tda-input" rows="2"
                [(ngModel)]="form.meta_description"
                placeholder="160 character SEO description for Google"></textarea>
            </div>
            <div class="col-md-6">
              <label class="tda-field-label">Hero tagline</label>
              <input type="text" class="form-control tda-input"
                [(ngModel)]="form.hero_tagline"
                placeholder="e.g. The right pillow changes everything." />
            </div>
            <div class="col-md-6">
              <label class="tda-field-label">Display order</label>
              <input type="number" class="form-control tda-input"
                [(ngModel)]="form.display_order" min="0" />
            </div>
            <div class="col-12">
              <div class="tda-switch-row">
                <div>
                  <p class="tda-switch-label mb-0">Active / Visible</p>
                  <p class="tda-switch-hint mb-0">Hidden categories won't appear on the site</p>
                </div>
                <div class="form-check form-switch mb-0">
                  <input class="form-check-input tda-switch" type="checkbox"
                    [(ngModel)]="form.is_active" />
                </div>
              </div>
            </div>
          </div>

          @if (formError()) {
            <div class="tda-field-error mt-3">{{ formError() }}</div>
          }

          <div class="d-flex gap-2 justify-content-end mt-4">
            <button class="btn tda-btn-cancel" (click)="closeModal()">Cancel</button>
            <button class="btn tda-btn-save px-4" [disabled]="formSaving()" (click)="save()">
              @if (formSaving()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              {{ editingCat() ? 'Update' : 'Add category' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="tda-modal-backdrop" (click)="deleteTarget.set(null)">
        <div class="tda-modal" (click)="$event.stopPropagation()">
          <h3 class="tda-modal-title mb-2">Delete category?</h3>
          <p class="tda-modal-body mb-4">
            "<strong>{{ deleteTarget()!.name }}</strong>" will be deleted. Products in this category will not be deleted but will lose their category assignment.
          </p>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn tda-btn-cancel" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn tda-btn-confirm-delete" (click)="deleteCategory()">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tda-bs-page { max-width: 1200px; }
    .tda-bs-eyebrow { font-size:0.6875rem; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#b5832a; }
    .tda-bs-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.5rem,3vw,2.25rem); font-weight:400; color:#1a1a1a; }
    .tda-btn-primary { background:#1a1a2e; color:#fff; border:none; border-radius:2px; font-size:0.8125rem; font-weight:500; padding:0.5rem 1.25rem; transition:background 0.2s; }
    .tda-btn-primary:hover { background:#b5832a; color:#fff; }
    .tda-bs-card { background:#fff; border:1px solid #f0ead8; border-radius:4px; }
    .tda-cat-card { background:#fff; border:1px solid #f0ead8; border-radius:4px; padding:1.25rem; height:100%; }
    .tda-cat-num { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:300; color:rgba(181,131,42,0.25); line-height:1; flex-shrink:0; }
    .tda-cat-name { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:500; color:#1a1a1a; }
    .tda-cat-slug { font-size:0.75rem; color:#b5832a; font-weight:500; }
    .tda-cat-desc { font-size:0.8125rem; color:#888; line-height:1.55; }
    .tda-badge { font-size:0.625rem; font-weight:600; padding:2px 8px; border-radius:2px; }
    .tda-badge--red { background:#dc3545; color:#fff; }
    .tda-icon-btn { width:32px; height:32px; border:1px solid #f0ead8; background:#fff; border-radius:2px; display:flex; align-items:center; justify-content:center; color:#888; cursor:pointer; font-size:0.875rem; transition:all 0.15s; }
    .tda-icon-btn:hover { border-color:#1a1a2e; color:#1a1a2e; background:#fdf8ef; }
    .tda-icon-btn--danger:hover { border-color:#dc3545; color:#dc3545; background:#fff5f5; }
    .tda-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .tda-modal { background:#fff; border-radius:4px; padding:2rem; max-width:420px; width:100%; max-height:90vh; overflow-y:auto; }
    .tda-modal--lg { max-width:640px; }
    .tda-modal-title { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:500; color:#1a1a1a; }
    .tda-modal-body { font-size:0.9rem; color:#555; line-height:1.6; }
    .tda-close-btn { background:none; border:none; color:#888; font-size:0.875rem; cursor:pointer; padding:4px; }
    .tda-field-label { font-size:0.6875rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#888; display:block; margin-bottom:5px; }
    .tda-input { border:1px solid #f0ead8; border-radius:2px; font-size:0.875rem; color:#1a1a1a; background:#fdf8ef; }
    .tda-input:focus { border-color:#b5832a; box-shadow:0 0 0 3px rgba(181,131,42,0.1); background:#fff; }
    .tda-field-error { font-size:0.8125rem; color:#dc3545; background:#fff5f5; border:1px solid #ffd7d7; border-radius:2px; padding:0.5rem 0.75rem; }
    .tda-switch-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.75rem; background:#fdf8ef; border-radius:4px; }
    .tda-switch-label { font-size:0.875rem; font-weight:500; color:#1a1a1a; }
    .tda-switch-hint { font-size:0.75rem; color:#888; }
    .tda-switch { width:2.5rem; height:1.25rem; cursor:pointer; }
    .tda-switch:checked { background-color:#b5832a; border-color:#b5832a; }
    .tda-btn-save { background:#1a1a2e; color:#fff; border:none; border-radius:2px; font-size:0.875rem; font-weight:500; padding:0.625rem 1.25rem; }
    .tda-btn-save:hover:not(:disabled) { background:#b5832a; }
    .tda-btn-cancel { border:1px solid #f0ead8; background:#fff; color:#888; border-radius:2px; font-size:0.875rem; padding:0.625rem 1rem; }
    .tda-btn-confirm-delete { background:#dc3545; color:#fff; border:none; border-radius:2px; font-size:0.8125rem; font-weight:500; padding:0.5rem 1rem; }
    .tda-skeleton { background:linear-gradient(90deg,#f0ead8 25%,#f8f5ef 50%,#f0ead8 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `]
})
export class CategoriesComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showModal = signal(false);
  readonly editingCat = signal<Category | null>(null);
  readonly deleteTarget = signal<Category | null>(null);
  readonly formSaving = signal(false);
  readonly formError = signal<string | null>(null);

  form: Partial<Category> = {
    name: '', slug: '', description: '', meta_description: '',
    hero_tagline: '', display_order: 0, is_active: true
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.categories.set(await this.admin.getAllCategories());
    } finally {
      this.loading.set(false);
    }
  }

  openModal(cat?: Category): void {
    if (cat) {
      this.editingCat.set(cat);
      this.form = { ...cat };
    } else {
      this.editingCat.set(null);
      this.form = { name: '', slug: '', description: '', meta_description: '', hero_tagline: '', display_order: 0, is_active: true };
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  autoSlug(): void {
    if (!this.editingCat()) {
      this.form.slug = (this.form.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  async save(): Promise<void> {
    if (!this.form.name?.trim() || !this.form.slug?.trim()) {
      this.formError.set('Name and slug are required.');
      return;
    }
    this.formSaving.set(true);
    this.formError.set(null);
    try {
      if (this.editingCat()) {
        await this.admin.updateCategory(this.editingCat()!.id, this.form);
      } else {
        await this.admin.createCategory(this.form);
      }
      await this.load();
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? 'Something went wrong.');
    } finally {
      this.formSaving.set(false);
    }
  }

  confirmDelete(cat: Category): void {
    this.deleteTarget.set(cat);
  }

  async deleteCategory(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.admin.deleteCategory(target.id);
    this.categories.update(list => list.filter(c => c.id !== target.id));
    this.deleteTarget.set(null);
  }
}
