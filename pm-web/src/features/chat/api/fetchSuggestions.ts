import { apiClient } from '@/shared/api/client';
import type { SuggestedQuestionResponse } from '@/shared/api/types';

export async function fetchSuggestions(projectId: number): Promise<SuggestedQuestionResponse[]> {
  try {
    return await apiClient
      .get('api/documents/suggestions', { searchParams: { projectId } })
      .json<SuggestedQuestionResponse[]>();
  } catch {
    return [];
  }
}
