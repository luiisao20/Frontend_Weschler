import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL_PROD || '/api-chat'; 

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAIAssessmentStream = async (datosPaciente: any) => {
  const response = await apiClient.post(
    '/chat',
    { mensaje: datosPaciente },
    {
      responseType: 'stream',
      adapter: 'fetch',
    }
  );
  
  return response.data;
};

export default apiClient;
