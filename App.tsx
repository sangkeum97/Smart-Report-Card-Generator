import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import ReportForm from './components/ReportForm';
import ReportPreview from './components/ReportPreview';
import { ReportData, INITIAL_DATA } from './types';
import { GraduationCap, RotateCcw, UserPlus } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
            <p className="text-slate-600 mb-4">프로그램을 실행하는 도중 문제가 발생했습니다.</p>
            <div className="bg-slate-100 p-4 rounded text-xs font-mono text-slate-700 overflow-auto mb-6">
              {this.state.error?.message || "알 수 없는 오류"}
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              데이터 초기화 및 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [reportData, setReportData] = useState<ReportData>(INITIAL_DATA);
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  
  const handleReset = () => {
    if (confirm("모든 데이터를 초기화하고 새로운 리포트를 작성하시겠습니까?")) {
      setReportData(INITIAL_DATA);
      setViewMode('split'); // Force view to split so user can edit
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
          // Reset earned scores but keep structure (Metadata preserved)
          difficultyStats: prev.difficultyStats.map(s => ({ ...s, correct: 0 })),
          questionTypeStats: prev.questionTypeStats.map(s => ({ ...s, correct: 0 })),
          assessmentStats: prev.assessmentStats.map(s => ({ ...s, earnedScore: 0 })),
          radarStats: prev.radarStats.map(s => ({ ...s, student: 0 }))
       }));
       setViewMode('split'); // Force view to split so user can edit
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
            <ReportForm data={reportData} onChange={setReportData} />
          </div>
          {/* Preview */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-8' : 'w-full max-w-4xl mx-auto'} h-full overflow-y-auto`}>
            <ReportPreview data={reportData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}