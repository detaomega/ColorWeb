import { APIResponse, StartGameRequest, StartGameResponse, SubmitAnswerRequest, SubmitAnswerResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export class GameAPIService {
  private static async fetchAPI<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async startGame(request: StartGameRequest): Promise<StartGameResponse> {
    const response = await this.fetchAPI<StartGameResponse>('/game/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to start game');
    }

    return response.data;
  }

  static async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const response = await this.fetchAPI<SubmitAnswerResponse>('/game/answer', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to submit answer');
    }

    return response.data;
  }

  static async endGame(sessionId: string): Promise<void> {
    await this.fetchAPI(`/game/end/${sessionId}`, {
      method: 'POST',
    });
  }
}