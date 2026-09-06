import React, { useState } from "react";
import { Brain, Bot, Sparkles, AlertTriangle, X, Loader2, RefreshCw } from "lucide-react";
import type { AIProvider } from "../../utils/axios.helper";

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  // OpenAI
  openaiText: string;
  setOpenaiText: (text: string) => void;
  isGeneratingOpenai: boolean;
  onGenerateOpenai: () => void;
  onRegenerateOpenai: () => void;
  // Claude
  claudeText: string;
  setClaudeText: (text: string) => void;
  isGeneratingClaude: boolean;
  onGenerateClaude: () => void;
  onRegenerateClaude: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  onApply,
  openaiText,
  setOpenaiText,
  isGeneratingOpenai,
  onGenerateOpenai,
  onRegenerateOpenai,
  claudeText,
  setClaudeText,
  isGeneratingClaude,
  onGenerateClaude,
  onRegenerateClaude,
}) => {
  const [activeTab, setActiveTab] = useState<AIProvider>("openai");

  if (!isOpen) return null;

  const isCurrentGenerating =
    activeTab === "openai" ? isGeneratingOpenai : isGeneratingClaude;
  const currentText = activeTab === "openai" ? openaiText : claudeText;
  const setCurrentText =
    activeTab === "openai" ? setOpenaiText : setClaudeText;
  const handleGenerateCurrent =
    activeTab === "openai" ? onGenerateOpenai : onGenerateClaude;
  const handleRegenerateCurrent =
    activeTab === "openai" ? onRegenerateOpenai : onRegenerateClaude;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-teal-700 font-bold">
            <Brain className="w-5 h-5" />
            <span>Generación de Análisis con IA</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 pb-2 bg-gray-50/50 border-b border-gray-100">
          <div className="flex bg-gray-200/70 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("openai")}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                activeTab === "openai"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>ChatGPT</span>
              {openaiText && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" title="Análisis disponible" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("claude")}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                activeTab === "claude"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Claude</span>
              {claudeText && (
                <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Análisis disponible" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Claude Warning Banner */}
          {activeTab === "claude" && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-950 block">
                  Aviso sobre consumo de recursos
                </span>
                <span className="text-[11px] text-amber-800 leading-snug block">
                  El modelo Claude ofrece mayor profundidad analítica y clínica, pero consume significativamente más recursos y tokens que ChatGPT.
                </span>
              </div>
            </div>
          )}

          {/* ChatGPT Info Banner */}
          {activeTab === "openai" && (
            <p className="text-xs text-gray-500">
              Genera una estructuración y lectura cualitativa equilibrada y rápida con ChatGPT.
            </p>
          )}

          {/* Tab Content: Empty State vs Textarea */}
          {!currentText && !isCurrentGenerating ? (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/50">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700">
                {activeTab === "openai" ? (
                  <Bot className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Sparkles className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">
                  Sin análisis generado para {activeTab === "openai" ? "ChatGPT" : "Claude"}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  Presiona el botón a continuación para generar la interpretación clínica con este modelo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateCurrent}
                className="mt-2 inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                {activeTab === "openai" ? (
                  <>
                    <Bot className="w-4 h-4 mr-1.5" />
                    Generar con ChatGPT
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Generar con Claude
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  Interpretación del perfil cognitivo ({activeTab === "openai" ? "ChatGPT" : "Claude"}):
                </span>
                {isCurrentGenerating && (
                  <span className="inline-flex items-center text-[11px] font-bold text-teal-700">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generando respuesta...
                  </span>
                )}
              </div>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                disabled={isCurrentGenerating}
                className="w-full h-64 p-4 border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition text-sm leading-relaxed disabled:bg-gray-50"
                placeholder={
                  isCurrentGenerating
                    ? "Generando análisis, por favor espera un momento..."
                    : "El análisis aparecerá aquí..."
                }
              />
              <p className="text-[11px] text-gray-400">
                Puedes editar el texto antes de aplicarlo al informe final.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div>
            {currentText && (
              <button
                type="button"
                onClick={handleRegenerateCurrent}
                disabled={isCurrentGenerating}
                className="px-3.5 py-2 rounded-xl text-teal-700 bg-teal-100 hover:bg-teal-200 font-bold text-xs transition flex items-center cursor-pointer disabled:opacity-50"
              >
                {isCurrentGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                )}
                Regenerar {activeTab === "openai" ? "ChatGPT" : "Claude"}
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 font-bold text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onApply(currentText)}
              disabled={!currentText || isCurrentGenerating}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-sm transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>Aplicar al Informe</span>
              <span className="text-teal-200 text-xs font-normal">
                ({activeTab === "openai" ? "ChatGPT" : "Claude"})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
