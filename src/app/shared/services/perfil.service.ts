import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuizResponse, QuizSubmissaoResponse, RespostaQuiz } from '../models/quiz';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/perfil`;

  obterQuiz(): Observable<QuizResponse> {
    return this.http.get<QuizResponse>(`${this.baseUrl}/quiz`);
  }

  submeterQuiz(respostas: RespostaQuiz[]): Observable<QuizSubmissaoResponse> {
    return this.http.put<QuizSubmissaoResponse>(`${this.baseUrl}/quiz`, { respostas });
  }
}
