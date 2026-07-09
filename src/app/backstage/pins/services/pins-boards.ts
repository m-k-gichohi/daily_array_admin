import { Injectable } from "@angular/core";
import { Observable,  from } from "rxjs";
import {
 
  map,
} from "rxjs/operators";
import { PinterestBoardsResponse, PinterestBoard } from "../model/pin-boards";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "src/environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class PinsBoardsService {
  readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );
  getAllBoards(): Observable<PinterestBoard[]> {
    return from(this.supabase.functions.invoke("fetch-boards")).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return data.boards as PinterestBoard[];
      }),
    );
  }
}
