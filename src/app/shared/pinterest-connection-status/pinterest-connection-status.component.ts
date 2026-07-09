import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { PinterestAuthService } from 'src/app/services/pinterest-auth.service';

@Component({
  selector: 'app-pinterest-connection-status',
  standalone: true,
  templateUrl: './pinterest-connection-status.component.html',
  styleUrl: './pinterest-connection-status.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinterestConnectionStatusComponent implements OnInit {
  private readonly auth = inject(PinterestAuthService);

  readonly connected = signal(false);
  readonly username = signal<string | null>(null);
  readonly loading = signal(true);
  readonly disconnecting = signal(false);

  @Input() description = 'Connect your account to load boards and unlock Pinterest scheduling.';
  @Input() connectLabel = 'Connect Pinterest';
  @Input() disconnectLabel = 'Disconnect Pinterest';
  @Input() connectedPrefix = 'Connected as';

  ngOnInit(): void {
    void this.updateStatus();
  }

  connect(): void {
    this.auth.redirectToPinterestLogin();
  }

  async disconnect(): Promise<void> {
    this.disconnecting.set(true);
    try {
      await this.auth.disconnectPinterest();
      this.connected.set(false);
      this.username.set(null);
    } finally {
      this.disconnecting.set(false);
    }
  }

  async updateStatus(): Promise<void> {
    this.loading.set(true);
    const status = await this.auth.getConnectionStatus();
    this.connected.set(status.connected);
    this.username.set(status.username);
    this.loading.set(false);
  }
}
