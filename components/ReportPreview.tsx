import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ReportData } from '../types';
import { FileDown, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReportPreviewProps {
  data: ReportData;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ data }) => {
  const reportRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true
        });
        const link = document.createElement('a');
        link.download = `${data.studentName}_성적분석리포트.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Download failed", err);
        alert("이미지 저장 중 오류가 발생했습니다.");
      }
    }
  };

  // Process Assessment Stats for List
  const assessmentData = data.assessmentStats.map(a => ({
    name: a.name,
    max: a.maxScore,
    earned: a.earnedScore,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md text-sm font-medium"
        >
          <FileDown size={18} />
          이미지로 저장
        </button>
      </div>

      {/* Report Container */}
      <div 
        ref={reportRef} 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto w-full text-slate-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{data.examTitle}</h1>
            <div className="text-slate-200 text-lg opacity-90">성적 분석 리포트</div>
          </div>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-bold">{data.score}<span className="text-2xl ml-1">점</span></div>
            <div className="text-lg mt-2 font-medium">{data.studentName} 학생</div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-8 border-b-2 border-blue-200">
          <div className="flex gap-6 items-start">
            <div className="text-4xl">🏆</div>
            <div>
              <h2 className="text-xl font-bold text-blue-900 mb-3">시험 총평</h2>
              <p className="text-slate-700 leading-relaxed text-lg break-keep whitespace-pre-line">
                {data.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section: Difficulty & Assessment Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 pb-4">
          
          {/* Difficulty & Question Type Ratio Graph */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🎯</span> 정답률 분석 (난이도/유형)
            </h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto">
              {/* Difficulty Stats (Blue) */}
              <div>
                <div className="text-xs font-bold text-slate-500 mb-3 pl-1">난이도별</div>
                <div className="space-y-4">
                  {data.difficultyStats.map((d, i) => {
                    const rate = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                    return (
                      <div key={i} className="w-full">
                        <div className="flex justify-between items-end mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold px-2 py-0.5 rounded text-slate-600 bg-slate-200`}>
                              {d.label}
                            </span>
                            <span className="text-xs text-slate-500">{d.correct} / {d.total} 문제</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{rate}%</span>
                        </div>
                        {/* Ratio Bar */}
                        <div className="w-full h-5 bg-slate-200 rounded-full flex overflow-hidden shadow-inner">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ width: `${rate}%` }}
                          >
                          </div>
                          <div 
                            className="bg-slate-300 h-full transition-all duration-500"
                            style={{ width: `${100 - rate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-slate-200"></div>

              {/* Question Type Stats (Purple) */}
              <div>
                 <div className="text-xs font-bold text-slate-500 mb-3 pl-1">문항 유형별</div>
                 <div className="space-y-4">
                  {(data.questionTypeStats || []).map((d, i) => {
                    const rate = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                    return (
                      <div key={i} className="w-full">
                        <div className="flex justify-between items-end mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold px-2 py-0.5 rounded text-purple-700 bg-purple-100`}>
                              {d.label}
                            </span>
                            <span className="text-xs text-slate-500">{d.correct} / {d.total} 문제</span>
                          </div>
                          <span className="text-sm font-bold text-purple-600">{rate}%</span>
                        </div>
                        {/* Ratio Bar */}
                        <div className="w-full h-5 bg-slate-200 rounded-full flex overflow-hidden shadow-inner">
                          <div 
                            className="bg-purple-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ width: `${rate}%` }}
                          >
                          </div>
                          <div 
                            className="bg-slate-300 h-full transition-all duration-500"
                            style={{ width: `${100 - rate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                 </div>
              </div>
            </div>
          </div>

          {/* Assessment Score List (Emerald) */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📊</span> 단원별 성취도
            </h3>
            
            {/* Custom Progress Bar list */}
            <div className="flex-1 flex flex-col justify-center space-y-5 overflow-y-auto py-2">
                {assessmentData.map((d, i) => (
                    <div key={i} className="w-full">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-700">{d.name}</span>
                            <span className="text-slate-500 text-xs font-medium bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm">
                              {d.earned} <span className="text-slate-300">/</span> {d.max}점
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden relative shadow-inner">
                            <div 
                                className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                style={{ width: `${(d.earned / d.max) * 100}%` }}
                            >
                              <span className="text-[10px] text-white font-bold drop-shadow-md">
                                {Math.round((d.earned / d.max) * 100)}%
                              </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-right text-slate-400">
              * 각 단원별 배점 대비 득점 현황
            </div>
          </div>

        </div>

        {/* Regional Difficulty Analysis (Moved Below) */}
        <div className="px-8 pb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                 <span>💡</span> 지역 난이도 비교 분석
               </h4>
               <p className="text-slate-700 leading-relaxed break-keep">
                 {data.difficultyAnalysis || "난이도 분석 정보가 없습니다."}
               </p>
            </div>
        </div>

        {/* Radar Chart Section */}
        <div className="px-8 pb-8">
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📈</span> 5대 역량 분석
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarStats}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name={data.studentName}
                      dataKey="student"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200 text-slate-700 leading-relaxed text-sm md:text-base shadow-sm break-keep whitespace-pre-line">
                <p>
                  {data.radarAnalysis || "역량 분석 데이터가 없습니다."}
                </p>
              </div>
            </div>
           </div>
        </div>

        {/* Incorrect Answers Analysis */}
        {data.incorrectAnswers && data.incorrectAnswers.length > 0 && (
          <div className="px-8 pb-8">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <XCircle size={20} className="text-red-500" />
                오답 문항 분석
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="text-xs text-slate-500 uppercase bg-red-100/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg whitespace-nowrap">문항</th>
                      <th className="px-4 py-3 whitespace-nowrap">단원</th>
                      <th className="px-4 py-3 min-w-[150px]">틀린 이유</th>
                      <th className="px-4 py-3 rounded-tr-lg min-w-[200px]">해결 방안</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 bg-white">
                    {data.incorrectAnswers.map((item, index) => (
                      <tr key={index} className="hover:bg-red-50/30">
                        <td className="px-4 py-3 font-bold text-red-600 whitespace-nowrap">{item.questionNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{item.topic}</td>
                        <td className="px-4 py-3 break-keep">{item.reason}</td>
                        <td className="px-4 py-3 text-blue-700 font-medium break-keep">{item.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Learning Direction */}
        <div className="p-8 border-t-2 border-slate-100 bg-white">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">📚 앞으로의 학습 방향</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-600">
               <h4 className="text-lg font-bold text-slate-700 mb-3">✨ 강점 (Keep)</h4>
               <ul className="space-y-2">
                 {data.strengths.map((s, i) => (
                   <li key={i} className="flex items-start gap-2 text-slate-700 break-keep">
                     <span className="text-slate-500 font-bold mt-1.5 text-[0.5rem]">•</span>
                     <span>{s}</span>
                   </li>
                 ))}
               </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-red-400">
               <h4 className="text-lg font-bold text-slate-700 mb-3">🎯 보완 (Improve)</h4>
               <ul className="space-y-2">
                 {data.weaknesses.map((w, i) => (
                   <li key={i} className="flex items-start gap-2 text-slate-700 break-keep">
                     <span className="text-red-400 font-bold mt-1.5 text-[0.5rem]">•</span>
                     <span>{w}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          <div className="bg-slate-800 text-slate-100 p-8 rounded-xl shadow-inner">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>💌</span> 부모님께 드리는 말씀
            </h4>
            <p className="leading-relaxed text-slate-300 break-keep whitespace-pre-line">
              {data.parentMessage}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 text-slate-400 p-6 text-center text-sm">
          <p>본 리포트는 {data.examDate} 시행된 평가를 바탕으로 작성되었습니다.</p>
          <p className="mt-1 text-xs opacity-70">학부모님 전달용 공식 분석 자료</p>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;