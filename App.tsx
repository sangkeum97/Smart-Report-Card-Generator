import React, { useState, useEffect } from 'react';
import ReportForm from './components/ReportForm';
import ReportPreview from './components/ReportPreview';
import { ReportData, INITIAL_DATA } from './types';
import { GraduationCap, RotateCcw, UserPlus, Key, Settings } from 'lucide-react';

function App() {
  const [reportData, setReportData] = useState<ReportData>(INITIAL_DATA);
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isEnvKeyAvailable, setIsEnvKeyAvailable] = useState(false);

  // Initial load of API Key
  useEffect(() => {
    let foundKey = '';
    let fromEnv = false;

    // 1. Safe check for process.env (Common in most build tools)
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) {
          foundKey = process.env.API_KEY;
          fromEnv = true;
        } else if (process.env.REACT_APP_API_KEY) {
           foundKey = process.env.REACT_APP_API_KEY;
           fromEnv = true;
        }
      }
    } catch (e) {
      console.warn("process.env access failed", e);
    }

    // 2. Safe check for Vite import.meta.env
    // Wrapped in try-catch and checking typeof to avoid ReferenceErrors/SyntaxErrors in some environments
    if (!foundKey) {
      try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
           // @ts-ignore
           if (import.meta.env.VITE_API_KEY) {
             // @ts-ignore
             foundKey = import.meta.env.VITE_API_KEY;
             fromEnv = true;
           }
           // @ts-ignore
           else if (import.meta.env.API_KEY) {
             // @ts-ignore
             foundKey = import.meta.env.API_KEY;
             fromEnv = true;
           }
        }
      } catch (e) {
        console.warn("import.meta access failed", e);
      }
    }

    setIsEnvKeyAvailable(fromEnv);

    if (foundKey) {
      setApiKey(foundKey);
    } else {
      // 3. Check LocalStorage
      const storedKey = localStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        setIsApiKeyModalOpen(true);
      }
    }
  }, []);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      setIsApiKeyModalOpen(false);
    } else {
      alert("API Key를 입력해주세요.");
    }
  };

  const handleClearApiKey = () => {
    if (confirm("저장된 API Key를 삭제하시겠습니까?")) {
      localStorage.removeItem('GEMINI_API_KEY');
      setApiKey('');
      setTempApiKey('');
      setIsApiKeyModalOpen(true);
    }
  };

  const handleReset = () => {
    if (confirm("모든 데이터를 초기화하고 새로운 리포트를 작성하시겠습니까?")) {
      setReportData(INITIAL_DATA);
      window.scrollTo(0,0);
    }
  };

  const handleNextStudent = () => {
     if (confirm("시험 정보(난이도, 단원 등)는 유지하고\n학생별 점수와 분석 내용만 초기화하시겠습니까?")) {
       setReportData(prev => ({
          ...prev,
          studentName: "",
          score: 0,
          summary: "내용을 생성하거나 입력해주세요.",
          radarAnalysis: "내용을 생성하거나 입력해주세요.",
          strengths: [],
          weaknesses: [],
          parentMessage: "내용을 생성하거나 입력해주세요.",
          incorrectAnswers: [],
          // Reset earned scores but keep structure
          difficultyStats: prev.difficultyStats.map(s => ({ ...s, correct: 0 })),
          questionTypeStats: prev.questionTypeStats.map(s => ({ ...s, correct: 0 })),
          assessmentStats: prev.assessmentStats.map(s => ({ ...s, earnedScore: 0 })),
          radarStats: prev.radarStats.map(s => ({ ...s, student: 0 }))
       }));
       window.scrollTo(0,0);
     }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-blue-400" size={28} />
            <div>
              <h1 className="font-bold text-lg leading-tight">Smart Report Gen</h1>
              <p className="text-xs text-slate-400">AI 성적 분석 리포트</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
             <button 
                onClick={() => { setTempApiKey(apiKey); setIsApiKeyModalOpen(true); }}
                className="flex items-center gap-1 px-3 py-1 text-slate-300 hover:text-white text-xs transition-colors"
                title="API Key 설정"
             >
                <Settings size={14} /> <span className="hidden md:inline">API 설정</span>
             </button>

             <div className="w-px h-4 bg-slate-700 mx-1"></div>

             <button onClick={handleNextStudent} className="flex items-center gap-1 px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white text-sm rounded-md transition-colors" title="시험 정보 유지, 학생 정보 초기화">
               <UserPlus size={14} /> <span className="hidden md:inline">다음 학생</span>
             </button>
             <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-md transition-colors">
               <RotateCcw size={14} /> <span className="hidden md:inline">초기화</span>
             </button>
             
             <div className="hidden md:flex gap-1 bg-slate-800 p-1 rounded-lg ml-2">
                <button onClick={() => setViewMode('split')} className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'split' ? 'bg-blue-600' : 'text-slate-400'}`}>입력+미리보기</button>
                <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'preview' ? 'bg-blue-600' : 'text-slate-400'}`}>미리보기만</button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-100 p-4 md:p-6 overflow-hidden">
        <div className={`max-w-[1600px] mx-auto h-full grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Editor */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-4' : 'hidden'} h-full`}>
            <ReportForm data={reportData} onChange={setReportData} apiKey={apiKey} />
          </div>
          {/* Preview */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-8' : 'w-full max-w-4xl mx-auto'} h-full overflow-y-auto`}>
            <ReportPreview data={reportData} />
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <Key size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Google Gemini API Key 설정</h2>
             </div>
             
             <p className="text-sm text-slate-600 mb-4 leading-relaxed">
               AI 기능을 사용하기 위해 API Key가 필요합니다.<br/>
               <span className="text-xs text-slate-400">* 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</span>
             </p>

             <input 
               type="password"
               placeholder="AI Studio API Key 입력"
               value={tempApiKey}
               onChange={(e) => setTempApiKey(e.target.value)}
               className="w-full p-3 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
             />

             <div className="flex justify-between gap-3">
                {apiKey && !isEnvKeyAvailable && (
                  <button onClick={handleClearApiKey} className="text-red-500 text-sm font-medium hover:bg-red-50 px-3 py-2 rounded">
                    키 삭제
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                   {apiKey && (
                     <button onClick={() => setIsApiKeyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                       닫기
                     </button>
                   )}
                   <button onClick={handleSaveApiKey} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                     저장 및 시작
                   </button>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t text-xs text-slate-400">
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">API Key 발급받기 (Google AI Studio)</a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;