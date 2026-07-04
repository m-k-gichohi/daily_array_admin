import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment.development";
import { SupabaseService } from "./supabase.service";

export interface PinterestTokenRecord {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  scope: string;
  username: string;
}

@Injectable({ providedIn: "root" })
export class PinterestAuthService {
  private readonly authorizeUrl = "https://www.pinterest.com/oauth";
  private readonly tokenUrl = "https://api.pinterest.com/v5/oauth/token";
  private readonly scope_app =
    "boards:read,pins:read,pins:write,user_accounts:read";

  private readonly clientId = environment.pinterestClientId;
  private readonly clientSecret = environment.pinterestClientSecret;
  private readonly redirectUri =
    environment.pinterestRedirectUri ||
    `${window.location.origin}/backstage/pins`;
  private tokenCache: PinterestTokenRecord | null = null;

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService,
  ) {}

  redirectToPinterestLogin(): void {
    const state = crypto.randomUUID();
    sessionStorage.setItem("tda_pinterest_oauth_state", state);



    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope_app,
      state,
    });

    window.location.href = `${this.authorizeUrl}?${params.toString()}`;
  }

  async handleRedirectCallback(
    code: string | null,
    state: string | null,
  ): Promise<void> {
  

    if (!code || !state) {
      return;
    }

    const savedState = sessionStorage.getItem("tda_pinterest_oauth_state");
    sessionStorage.removeItem("tda_pinterest_oauth_state");

  

    if (!savedState || savedState !== state) {
      return;
    }

    try {
      const tokenData = await this.exchangeCodeForToken(code);
         const payload = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    scope:tokenData.scope,
    username:tokenData.username,
    expires_in:tokenData.expires_in,
    expires_at: new Date(tokenData.expires_at).toISOString(),   // Convert number → ISO
    
  };
      await this.supabase.upsertPinterestToken(payload);
      this.tokenCache = tokenData;
    } catch (error) {
    }
  }

  async getPinterestToken(): Promise<PinterestTokenRecord | null> {
    if (this.tokenCache) {
      return this.tokenCache;
    }

    const token = await this.supabase.getPinterestToken();
    if (!token) {
      return null;
    }

    this.tokenCache = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
        expires_in: token.expires_in,
      expires_at: token.expires_at,
      scope: token.scope,
      username: token.username,
    };

    return this.tokenCache;
  }

  async getAccessToken(): Promise<string | null> {
    const token = await this.getPinterestToken();
    if (!token) return null;

   

    if (Date.now() > token.expires_at - 60_000) {
      if (!token.refresh_token) return null;
      const refreshed = await this.refreshAccessToken(token.refresh_token);
      await this.supabase.upsertPinterestToken(refreshed);
      this.tokenCache = refreshed;
      return refreshed.access_token;
    }

    return token.access_token;
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    username: string | null;
  }> {
    const token = await this.getPinterestToken();
    if (!token) {
      return { connected: false, username: null };
    }

 

    if (Date.now() > token.expires_at - 60_000 && token.refresh_token) {
      try {
        const refreshed = await this.refreshAccessToken(token.refresh_token);
        await this.supabase.upsertPinterestToken(refreshed);
        this.tokenCache = refreshed;
        return { connected: true, username: refreshed.username };
      } catch (error) {
        return { connected: false, username: token.username };
      }
    }

    return { connected: true, username: token.username };
  }

  private async exchangeCodeForToken(
    code: string,
  ): Promise<PinterestTokenRecord> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      refresh_token: "",
      scope: this.scope_app,
    }).toString();

    const headers = new HttpHeaders({
      Authorization: this.getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    });

 
    const response = await firstValueFrom(
      this.http.post<any>(this.tokenUrl, body, { headers }),
    );

    return this.normalizeTokenResponse(response);
  }

  private getBasicAuthHeader(): string {
    const credentials = `${this.clientId}:${this.clientSecret}`;
    // btoa() works for ASCII strings (which client_id + secret usually are)
    return `Basic ${btoa(credentials)}`;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<PinterestTokenRecord> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }).toString();

    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    });

    const response = await firstValueFrom(
      this.http.post<any>(this.tokenUrl, body, { headers }),
    );

    return this.normalizeTokenResponse(response);
  }

  private normalizeTokenResponse(response: any): PinterestTokenRecord {
    const expiresIn = Number(response?.expires_in ?? 0);
    return {
      access_token: response?.access_token ?? "",
      refresh_token: response?.refresh_token ?? "",
        expires_in: expiresIn,
      expires_at: Date.now() + expiresIn * 1000,
      scope: response?.scope ?? "",
      username: response?.username ?? "",
    };
  }
}
