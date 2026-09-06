import { fetchAIAssessmentStream, type AIProvider } from "../utils/axios.helper";

export type { AIProvider };

export interface IndexItemSummary {
  code: string;
  name: string;
  composite: string;
  ci: string;
}

export interface AiAnalysisParams {
  provider?: AIProvider;
  patientAge: number;
  scaleBadgeLabel: string;
  confidenceInterval: "90" | "95";
  primaryList: IndexItemSummary[];
  secondaryList: IndexItemSummary[];
  onProgress?: (text: string) => void;
}

export const generateAiAnalysis = async ({
  provider = "openai",
  patientAge,
  scaleBadgeLabel,
  confidenceInterval,
  primaryList,
  secondaryList,
  onProgress,
}: AiAnalysisParams): Promise<string> => {
  const resultados: Record<string, any> = {};

  primaryList.forEach((curr) => {
    if (curr.composite !== "-" && curr.composite !== undefined) {
      resultados[`${curr.name} (${curr.code})`] = {
        puntaje: Number(curr.composite),
        intervalo: curr.ci !== "-" ? curr.ci : null,
      };
    }
  });

  secondaryList.forEach((curr) => {
    if (curr.composite !== "-" && curr.composite !== undefined) {
      resultados[`${curr.name} (${curr.code})`] = {
        puntaje: Number(curr.composite),
        intervalo: curr.ci !== "-" ? curr.ci : null,
      };
    }
  });

  const datosPaciente = {
    paciente_edad: patientAge,
    prueba: scaleBadgeLabel,
    nivel_confianza: `${confidenceInterval}%`,
    resultados,
  };

  const stream = await fetchAIAssessmentStream(datosPaciente, provider);

  if (!stream || !stream.getReader) {
    const fallbackText = stream?.texto || JSON.stringify(stream);
    if (onProgress) onProgress(fallbackText);
    return fallbackText;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  let textoCompleto = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lineas = chunk.split("\n");

    for (const linea of lineas) {
      if (linea.startsWith("data: ")) {
        try {
          const data = JSON.parse(linea.substring(6));
          if (data.texto) {
            textoCompleto += data.texto;
            if (onProgress) onProgress(textoCompleto);
          }
        } catch (e) {
          // Ignorar chunks no parseables
        }
      }
    }
  }

  return textoCompleto;
};
