import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, throwError, of, from } from "rxjs";
import { catchError, switchMap, expand, takeWhile, reduce } from "rxjs/operators";
import { PinterestBoardsResponse, PinterestBoard } from "../model/pin-boards";
import { PinterestAuthService } from "../../../services/pinterest-auth.service";
@Injectable({
  providedIn: "root",
})
export class PinsBoardsService {
  private readonly baseUrl = "https://api.pinterest.com/v5";
  constructor(private http: HttpClient, private auth: PinterestAuthService) {}

  /**
   * Fetch boards with pagination support
   */
  getBoards(
    params: {
      pageSize?: number;
      bookmark?: string;
      includeEmpty?: boolean;
      includeArchived?: boolean;
    } = {},
  ): Observable<PinterestBoardsResponse> {
    let httpParams = new HttpParams().set(
      "page_size",
      (params.pageSize ?? 100).toString(),
    );

    if (params.bookmark)
      httpParams = httpParams.set("bookmark", params.bookmark);
    if (params.includeEmpty !== undefined)
      httpParams = httpParams.set(
        "include_empty",
        params.includeEmpty.toString(),
      );
    if (params.includeArchived !== undefined)
      httpParams = httpParams.set(
        "include_archived",
        params.includeArchived.toString(),
      );

    return from(this.auth.getAccessToken()).pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of({ items: [], bookmark: undefined } as PinterestBoardsResponse);
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        });

        return this.http.get<PinterestBoardsResponse>(`${this.baseUrl}/boards`, {
          headers,
          params: httpParams,
        });
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Get ALL boards (handles pagination automatically)
   */
  getAllBoards(): Observable<PinterestBoard[]> {
    return this.getBoards({ pageSize: 100 }).pipe(
      expand((response) => {
        return response.bookmark
          ? this.getBoards({ pageSize: 100, bookmark: response.bookmark })
          : of({ items: [], bookmark: undefined } as PinterestBoardsResponse);
      }),
      takeWhile((response) => !!response.bookmark, true), // Include last page
      reduce((acc: PinterestBoard[], response) => {
        return [...acc, ...response.items];
      }, []),
    );
  }

  /**
   * Get single board
   */
  getBoard(boardId: string): Observable<PinterestBoard> {
    return from(this.auth.getAccessToken()).pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return throwError(() => new Error("No Pinterest token available."));
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        });

        return this.http.get<PinterestBoard>(`${this.baseUrl}/boards/${boardId}`, { headers });
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: any) {

    let message = "Failed to fetch Pinterest boards";

    if (error.status === 401)
      message = "Unauthorized - Invalid or expired Pinterest token";
    if (error.status === 403)
      message = 'Forbidden - Make sure your token has "boards:read" scope';
    if (error.error?.message) message = error.error.message;

    return throwError(() => new Error(message));
  }

  // Optional: Dynamic token setter
  setAccessToken(token: string) {
    // You can use a BehaviorSubject to make this reactive
    console.log("Pinterest access token updated");
  }
}


