import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL_PROD || '/api-chat'; 

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type AIProvider = 'openai' | 'claude';

export const fetchAIAssessmentStream = async (
  datosPaciente: any,
  provider: AIProvider = 'openai'
) => {
  const endpoint = provider === 'claude' ? '/chat/claude' : '/chat/openai';
  const response = await apiClient.post(
    endpoint,
    { mensaje: datosPaciente },
    {
      responseType: 'stream',
      adapter: 'fetch',
    }
  );
  
  return response.data;
};

export default apiClient;
