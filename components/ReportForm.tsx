import React, { useState, useRef, useEffect } from 'react';
import { ReportData, DifficultyStat, AssessmentStat, RadarStat, IncorrectAnswer } from '../types';
import { generateReportAnalysis, analyzeExamFromImage } from '../services/geminiService';
import { Sparkles, Loader2, Plus, Trash2, Upload, FileImage, MessageSquarePlus, AlertCircle, Minus, FileText } from 'lucide-react';

interface ReportFormProps {
  data: ReportData;
  onChange: (data: ReportData) => void;
}

// Reusable Stepper Component
const NumberStepper = ({ value, onChange, min = 0, max = 100, className = "" }: { value: number, onChange: (val: number) => void, min?: number, max?: number, className?: string }) => {
  return (
    <div className={`flex items-center border border-slate-300 rounded-md overflow-hidden bg-white ${className}`}>
      <button 
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-2 py-2 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors"
      >
        <Minus size={14} />
      </button>
      <input 
        type="number" 
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value) || 0;
          onChange(Math.min(max, Math.max(min, val)));
        }}
        className="w-12 text-center text-sm outline-none appearance-none font-medium text-slate-700"
      />
      <button 
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-2 py-2 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

// Auto-resizing Textarea Component
const AutoResizeTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  minRows = 1 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
  className?: string; 
  minRows?: number;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    resize();
  }, [value]);

  useEffect(() => {
    // Initial resize on mount
    resize();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={minRows}
      className={`${className} overflow-hidden resize-none`}
    />
  );
};

const ReportForm: React.FC<ReportFormProps> = ({ data, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzingFileName, setAnalyzingFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [examContext, setExamContext] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ReportData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleStatChange = <T extends any>(
    arrayField: keyof ReportData, 
    index: number, 
    field: keyof T, 
    value: any
  ) => {
    const newArray = [...(data[arrayField] as any[])];
    newArray[index] = { ...newArray[index], [field]: value };
    handleChange(arrayField, newArray);
  };

  // 1. Text-based AI Analysis
  const handleAIAnalysis = async () => {
    setIsGenerating(true);
    try {
      const analysis = await generateReportAnalysis({
        studentName: data.studentName,
        score: data.score,
        assessmentStats: data.assessmentStats,
        difficultyStats: data.difficultyStats,
        questionTypeStats: data.questionTypeStats,
        radarStats: data.radarStats,
        incorrectAnswers: data.incorrectAnswers
      });
      
      onChange({
        ...data,
        summary: analysis.summary || data.summary,
        difficultyAnalysis: analysis.difficultyAnalysis || data.difficultyAnalysis,
        radarAnalysis: analysis.radarAnalysis || data.radarAnalysis,
        strengths: analysis.strengths || data.strengths,
        weaknesses: analysis.weaknesses || data.weaknesses,
        parentMessage: analysis.parentMessage || data.parentMessage
      });
    } catch (error) {
      alert("AI 분석 중 오류가 발생했습니다. 환경변수 API Key를 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Shared file processing logic
  const processFile = async (file: File) => {
    setIsAnalyzingImage(true);
    setAnalyzingFileName(file.name);
    
    try {
      const reader = new FileReader();
      
      const readPromise = new Promise<{base64Data: string, mimeType: string}>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
             const base64String = reader.result;
             
             // Show preview only if it's an image
             if (file.type.startsWith('image/')) {
                 setImagePreview(base64String); 
             } else {
                 // For PDF, maybe show a generic icon or keep null
                 setImagePreview(null); 
             }

             const base64Data = base64String.split(',')[1];
             const mimeType = file.type;
             resolve({ base64Data, mimeType });
          } else {
             reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { base64Data, mimeType } = await readPromise;

      const result = await analyzeExamFromImage(base64Data, mimeType, examContext);
      
      onChange({
        ...data,
        ...result,
        difficultyStats: result.difficultyStats || [],
        questionTypeStats: result.questionTypeStats || [],
        assessmentStats: result.assessmentStats || [],
        radarStats: result.radarStats || [],
        radarAnalysis: result.radarAnalysis || data.radarAnalysis,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        incorrectAnswers: result.incorrectAnswers || [],
      });
      
    } catch (err) {
      console.error(err);
      alert("파일 분석에 실패했습니다. 다시 시도해주세요.");
      setImagePreview(null);
    } finally {
      setIsAnalyzingImage(false);
      setAnalyzingFileName("");
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImagePreview(null), 1000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAnalyzingImage) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isAnalyzingImage) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isAnalyzingImage) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            processFile(file);
        } else {
            alert("이미지 또는 PDF 파일만 업로드 가능합니다.");
        }
    }
  };

  const handleTextArrayChange = (field: 'strengths' | 'weaknesses', index: number, value: string) => {
    const newArray = [...data[field]];
    newArray[index] = value;
    handleChange(field, newArray);
  };

  const addTextItem = (field: 'strengths' | 'weaknesses') => {
    handleChange(field, [...data[field], ""]);
  };

  const removeTextItem = (field: 'strengths' | 'weaknesses', index: number) => {
    const newArray = [...data[field]];
    newArray.splice(index, 1);
    handleChange(field, newArray);
  };

  const handleIncorrectAnswerChange = (index: number, field: keyof IncorrectAnswer, value: string) => {
    const newArray = [...(data.incorrectAnswers || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    handleChange('incorrectAnswers', newArray);
  };

  const addIncorrectAnswer = () => {
    handleChange('incorrectAnswers', [
      ...(data.incorrectAnswers || []), 
      { questionNumber: "", topic: "", reason: "", solution: "" }
    ]);
  };

  const removeIncorrectAnswer = (index: number) => {
    const newArray = [...(data.incorrectAnswers || [])];
    newArray.splice(index, 1);
    handleChange('incorrectAnswers', newArray);
  };

  const addAssessmentStat = () => {
    handleChange('assessmentStats', [
      ...(data.assessmentStats || []), 
      { name: "", maxScore: 20, earnedScore: 10 }
    ]);
  };

  const removeAssessmentStat = (index: number) => {
    const newArray = [...(data.assessmentStats || [])];
    newArray.splice(index, 1);
    handleChange('assessmentStats', newArray);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full overflow-y-auto border border-slate-200">
      
      {/* File Upload Section */}
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={24} className="text-blue-600"/>
          시험지 자동 분석
        </h2>

        {/* Context Input */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <MessageSquarePlus size={16} />
            시험지 정보 및 분석 요청 (선택사항)
          </label>
          <AutoResizeTextarea
            value={examContext}
            onChange={(e) => setExamContext(e.target.value)}
            placeholder="예: 중학교 2학년 수학 기말고사입니다. 서술형 문제 감점 요인을 분석해주세요."
            className="w-full p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px]"
            minRows={2}
          />
        </div>

        {/* Upload Box */}
        <div 
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full h-[180px]
            border-2 border-dashed rounded-lg transition-all relative overflow-hidden
            ${isAnalyzingImage 
              ? 'border-blue-400 bg-slate-50' 
              : isDragging
                ? 'bg-blue-100 border-blue-500 scale-[1.02] shadow-md'
                : 'bg-slate-50 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          {imagePreview && (
            <div className="absolute inset-0 z-0">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-30 blur-[2px]" />
            </div>
          )}

          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleFileUpload} 
            className="hidden" 
            id="exam-upload"
            ref={fileInputRef}
            disabled={isAnalyzingImage}
          />
          <label 
            htmlFor="exam-upload" 
            className={`cursor-pointer flex flex-col items-center justify-center w-full h-full gap-3 relative z-10 ${isAnalyzingImage ? 'pointer-events-none' : ''}`}
          >
            {isAnalyzingImage ? (
              <div className="flex flex-col items-center justify-center bg-white/80 p-4 rounded-xl shadow-sm backdrop-blur-sm">
                <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                <div className="text-center">
                  <span className="text-blue-700 font-bold text-sm block">분석 중...</span>
                  {analyzingFileName && <span className="text-blue-500 text-xs mt-1 block truncate max-w-[200px]">{analyzingFileName}</span>}
                </div>
              </div>
            ) : (
              <div className="pointer-events-none flex flex-col items-center justify-center">
                <Upload className={`transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} size={32} />
                <div className="text-center mt-3">
                  <span className={`block font-medium text-sm transition-colors ${isDragging ? 'text-blue-700' : 'text-slate-700'}`}>
                    {isDragging ? '여기에 놓으세요' : '시험지 파일 업로드 (이미지, PDF)'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">(클릭 또는 드래그)</span>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 pt-6 border-t border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">📝 데이터 직접 수정</h2>
        <button 
          onClick={handleAIAnalysis}
          disabled={isGenerating || isAnalyzingImage}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          현재 데이터로 분석글 재생성
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">기본 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">시험명</label>
              <input 
                type="text" 
                value={data.examTitle} 
                onChange={(e) => handleChange('examTitle', e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">시행일</label>
              <input 
                type="text" 
                value={data.examDate} 
                onChange={(e) => handleChange('examDate', e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">학생명</label>
              <input 
                type="text" 
                value={data.studentName} 
                onChange={(e) => handleChange('studentName', e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">점수</label>
              <input 
                type="number" 
                value={data.score} 
                onChange={(e) => handleChange('score', Number(e.target.value))}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
        </section>

        {/* Incorrect Answers Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={14} /> 오답 문항 분석
            </h3>
            <button onClick={addIncorrectAnswer} className="text-blue-600 hover:text-blue-800"><Plus size={16}/></button>
          </div>
          <div className="space-y-3">
            {data.incorrectAnswers && data.incorrectAnswers.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                <button 
                  onClick={() => removeIncorrectAnswer(idx)} 
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors z-10"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-8">
                  <input 
                    placeholder="문항 번호" 
                    value={item.questionNumber}
                    onChange={(e) => handleIncorrectAnswerChange(idx, 'questionNumber', e.target.value)}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <input 
                    placeholder="단원" 
                    value={item.topic}
                    onChange={(e) => handleIncorrectAnswerChange(idx, 'topic', e.target.value)}
                    className="p-2 border rounded text-sm w-full"
                  />
                </div>
                <div className="space-y-2">
                  <AutoResizeTextarea
                    placeholder="틀린 이유" 
                    value={item.reason}
                    onChange={(e) => handleIncorrectAnswerChange(idx, 'reason', e.target.value)}
                    className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none min-h-[38px]"
                  />
                  <AutoResizeTextarea
                    placeholder="해결 방안" 
                    value={item.solution}
                    onChange={(e) => handleIncorrectAnswerChange(idx, 'solution', e.target.value)}
                    className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none min-h-[38px]"
                  />
                </div>
              </div>
            ))}
            {(!data.incorrectAnswers || data.incorrectAnswers.length === 0) && (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                등록된 오답 문항이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* Difficulty & Type Stats */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">난이도 및 유형별 성취도</h3>
          
          {/* Difficulty Analysis Input */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-blue-800 mb-1">시험지 객관적 난이도 분석</label>
            <div className="text-[10px] text-slate-500 mb-2">학생의 점수와 무관하게, 시험 문제 자체가 지역/평균 대비 얼마나 어려웠는지 기술하세요.</div>
            <AutoResizeTextarea
              value={data.difficultyAnalysis}
              onChange={(e) => handleChange('difficultyAnalysis', e.target.value)}
              placeholder="예: 이번 시험은 킬러 문항이 다수 포함되어 지역 평균 대비 난이도가 '상'이었습니다."
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30"
              minRows={3}
            />
          </div>
          
          <div className="mb-2 text-xs font-bold text-slate-500 bg-slate-100 p-1 rounded inline-block">난이도별</div>
          {data.difficultyStats.map((stat, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="w-10 text-sm font-bold text-slate-600">{stat.label}</span>
              <div className="flex-1 flex gap-2 items-center justify-end">
                <span className="text-xs text-slate-400">전체</span>
                <NumberStepper 
                  value={stat.total}
                  onChange={(val) => handleStatChange<DifficultyStat>('difficultyStats', idx, 'total', val)}
                />
                <span className="text-slate-300">/</span>
                <span className="text-xs text-slate-400">정답</span>
                <NumberStepper 
                  value={stat.correct}
                  onChange={(val) => handleStatChange<DifficultyStat>('difficultyStats', idx, 'correct', val)}
                  max={stat.total}
                />
              </div>
            </div>
          ))}

          <div className="mb-2 mt-4 text-xs font-bold text-slate-500 bg-slate-100 p-1 rounded inline-block">문항 유형별</div>
           {data.questionTypeStats?.map((stat, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="w-10 text-sm font-bold text-slate-600 truncate">{stat.label}</span>
              <div className="flex-1 flex gap-2 items-center justify-end">
                <span className="text-xs text-slate-400">전체</span>
                <NumberStepper 
                  value={stat.total}
                  onChange={(val) => handleStatChange<DifficultyStat>('questionTypeStats', idx, 'total', val)}
                />
                <span className="text-slate-300">/</span>
                <span className="text-xs text-slate-400">정답</span>
                <NumberStepper 
                  value={stat.correct}
                  onChange={(val) => handleStatChange<DifficultyStat>('questionTypeStats', idx, 'correct', val)}
                  max={stat.total}
                />
              </div>
            </div>
          ))}
        </section>

         {/* Assessment/Topic Stats (Score Based) */}
         <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">단원별 성취도</h3>
            <button onClick={addAssessmentStat} className="text-blue-600 hover:text-blue-800" title="단원 추가"><Plus size={16}/></button>
          </div>
          
          {data.assessmentStats.map((stat, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
              <button 
                  onClick={() => removeAssessmentStat(idx)} 
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors z-10"
                  title="삭제"
                >
                  <Trash2 size={16} />
              </button>
              <input 
                className="w-full p-1 border-b border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-sm font-bold mb-2 outline-none pr-8"
                value={stat.name}
                onChange={(e) => handleStatChange<AssessmentStat>('assessmentStats', idx, 'name', e.target.value)}
                placeholder="단원명 (예: 수와 연산)"
              />
              <div className="flex gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">배점 (Max)</span>
                  <NumberStepper 
                    value={stat.maxScore}
                    onChange={(val) => handleStatChange<AssessmentStat>('assessmentStats', idx, 'maxScore', val)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 text-blue-600">내 점수</span>
                  <NumberStepper 
                    value={stat.earnedScore}
                    onChange={(val) => handleStatChange<AssessmentStat>('assessmentStats', idx, 'earnedScore', val)}
                    max={stat.maxScore}
                  />
                </div>
              </div>
            </div>
          ))}
          {data.assessmentStats.length === 0 && (
             <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                등록된 단원이 없습니다. <br/> + 버튼을 눌러 단원을 추가하세요.
             </div>
          )}
        </section>

         {/* Radar Stats */}
         <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">5대 역량 분석 (학생)</h3>
          
          <div className="mb-2">
            <label className="block text-xs font-bold text-blue-800 mb-1">역량 종합 평가</label>
             <AutoResizeTextarea
              value={data.radarAnalysis}
              onChange={(e) => handleChange('radarAnalysis', e.target.value)}
              placeholder="역량 차트를 바탕으로 한 구체적인 평가를 입력하세요."
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30"
              minRows={3}
            />
          </div>

          {data.radarStats.map((stat, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
               <span className="text-sm w-20 truncate">{stat.subject}</span>
               <div className="flex gap-2">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-blue-500 mb-1">학생</span>
                    <NumberStepper 
                      value={stat.student}
                      onChange={(val) => handleStatChange<RadarStat>('radarStats', idx, 'student', val)}
                    />
                 </div>
                 {/* Removed Average Input */}
               </div>
            </div>
          ))}
        </section>

        {/* Text Areas */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">종합 분석</h3>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">시험 총평</label>
            <AutoResizeTextarea
              value={data.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              minRows={4}
            />
          </div>

          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-700">강점</label>
                <button onClick={() => addTextItem('strengths')} className="text-blue-600 hover:text-blue-800"><Plus size={14}/></button>
             </div>
             <div className="space-y-2">
               {data.strengths.map((s, i) => (
                 <div key={i} className="flex gap-2">
                   <AutoResizeTextarea 
                     value={s} 
                     onChange={(e) => handleTextArrayChange('strengths', i, e.target.value)}
                     className="flex-1 p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                   <button onClick={() => removeTextItem('strengths', i)} className="text-red-400 hover:text-red-600 self-start mt-2 p-1"><Trash2 size={16}/></button>
                 </div>
               ))}
             </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-700">보완점</label>
                <button onClick={() => addTextItem('weaknesses')} className="text-blue-600 hover:text-blue-800"><Plus size={14}/></button>
             </div>
             <div className="space-y-2">
               {data.weaknesses.map((s, i) => (
                 <div key={i} className="flex gap-2">
                   <AutoResizeTextarea
                     value={s} 
                     onChange={(e) => handleTextArrayChange('weaknesses', i, e.target.value)}
                     className="flex-1 p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                   <button onClick={() => removeTextItem('weaknesses', i)} className="text-red-400 hover:text-red-600 self-start mt-2 p-1"><Trash2 size={16}/></button>
                 </div>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">부모님께 드리는 말씀</label>
            <AutoResizeTextarea
              value={data.parentMessage}
              onChange={(e) => handleChange('parentMessage', e.target.value)}
              className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              minRows={6}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportForm;