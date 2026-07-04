import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Product, Category } from "src/app/models";
import { AdminService } from "src/app/services/admin.service";
import { PinterestAuthService } from "../../services/pinterest-auth.service";
import { PinterestPin } from "./model/pins";
import { FormsModule } from "@angular/forms";
import { PinterestBoard } from "./model/pin-boards";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-pins",
  imports: [FormsModule],
  templateUrl: "./pins.component.html",
  styleUrl: "./pins.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(PinterestAuthService) as PinterestAuthService;

  readonly pins = signal<PinterestPin[]>([]);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<"all" | "draft" | "scheduled" | "posted" | "failed">(
    "all",
  );
  readonly pinterestConnected = signal(false);
  readonly pinterestUsername = signal<string | null>(null);
  readonly pinterestStatusLoading = signal(true);

  readonly showModal = signal(false);
  readonly editingPin = signal<PinterestPin | null>(null);
  readonly deleteTarget = signal<PinterestPin | null>(null);
  readonly formSaving = signal(false);
  readonly formError = signal<string | null>(null);
    readonly boards = signal<PinterestBoard[]>([]);

    route = inject(ActivatedRoute);
  
  scheduleDate = "";
  scheduleTime = "";

  form: Partial<PinterestPin> = {
    product_id: null,
    category_id: null,
    board_name: "",
    pin_title: "",
    pin_description: "",
    destination_url: "",
    status: "draft",
  };

  readonly filteredPins = computed(() => {
    const f = this.filter();
    if (f === "all") return this.pins();
    return this.pins().filter((p) => p.status === f);
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.updatePinterestStatus()]);

    this.route.data.subscribe((data) => {
      this.boards.set(data["boards"]);

    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [pins, products, categories] = await Promise.all([
        this.admin.getAllPins(),
        this.admin.getAllProducts(),
        this.admin.getAllCategories(),
      ]);
      this.pins.set(pins as PinterestPin[]);
      this.products.set(products);

      this.categories.set(categories);
    } finally {
      this.loading.set(false);
    }
  }

  countByStatus(status: string): number {
    return this.pins().filter((p) => p.status === status).length;
  }

  statusIcon(status: string): string {
    switch (status) {
      case "draft":
        return "bi-file-earmark";
      case "scheduled":
        return "bi-clock-history";
      case "posted":
        return "bi-check-circle-fill";
      case "failed":
        return "bi-exclamation-triangle-fill";
      default:
        return "bi-circle";
    }
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) +
      " EST"
    );
  }

  openModal(pin?: PinterestPin): void {
    if (pin) {
      this.editingPin.set(pin);
      this.form = { ...pin };
      if (pin.post_date) {
        const date = new Date(pin.post_date);
        this.scheduleDate = date.toISOString().substring(0, 10);
        this.scheduleTime = pin.post_time_est!;
      }
    } else {
      this.editingPin.set(null);
      this.form = {
        product_id: null,
        category_id: null,
        board_name: "",
        pin_title: "",
        pin_description: "",
        destination_url: "",
        status: "draft",
      };
      this.scheduleDate = "";
      this.scheduleTime = "";
    }
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onProductSelected(): void {
    const product = this.products().find((p) => p.id === this.form.product_id);
    if (product) {
      this.form.destination_url = `https://dailyarrayshop.com/products/${product.slug}`;
      this.form.category_id = product.category_id;
    }
  }

  async save(): Promise<void> {
    if (
      !this.form.pin_title?.trim() ||
      !this.form.pin_description?.trim() ||
      !this.form.board_name?.trim() ||
      !this.form.destination_url?.trim()
    ) {
      this.formError.set(
        "Pin title, description, board and destination URL are required.",
      );
      return;
    }

  

  

    this.formSaving.set(true);
    this.formError.set(null);

    const payload: Partial<PinterestPin> = {
      ...this.form,
      post_date: this.scheduleDate,
            post_time_est: this.scheduleTime,

    };

    try {
      if (this.editingPin()) {
        await this.admin.updatePin(this.editingPin()!.id, payload);
      } else {
        await this.admin.createPin(payload);
      }
      await this.load();
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? "Something went wrong.");
    } finally {
      this.formSaving.set(false);
    }
  }

  confirmDelete(pin: PinterestPin): void {
    this.deleteTarget.set(pin);
  }

  connectPinterest(): void {
    this.auth.redirectToPinterestLogin();
  }

  async updatePinterestStatus(): Promise<void> {
    this.pinterestStatusLoading.set(true);
    const status = await this.auth.getConnectionStatus();
    this.pinterestConnected.set(status.connected);
    this.pinterestUsername.set(status.username);
    this.pinterestStatusLoading.set(false);
  }

  async deletePin(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.admin.deletePin(target.id);
    this.pins.update((list) => list.filter((p) => p.id !== target.id));
    this.deleteTarget.set(null);
  }
}
