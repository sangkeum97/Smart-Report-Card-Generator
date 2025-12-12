import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReportData } from "../types";

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    examTitle: { type: Type.STRING },
    studentName: { type: Type.STRING },
    score: { type: Type.NUMBER },
    examDate: { type: Type.STRING },
    summary: { 
      type: Type.STRING, 
      description: "A detailed paragraph summarizing performance in Korean (approx. 5-6 sentences)." 
    },
    difficultyAnalysis: {
      type: Type.STRING,
      description: "A paragraph analyzing the OBJECTIVE difficulty of the exam paper itself compared to regional standards. Do NOT mention how the student performed here. Focus on question complexity, trickiness, and curriculum depth."
    },
    radarAnalysis: {
      type: Type.STRING,
      description: "A specific analysis paragraph (3-4 sentences) based on the radar stats (5 core competencies). Explain which skills are strong and which need balance."
    },
    strengths: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 3-5 specific strengths in Korean."
    },
    weaknesses: {
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 2-3 areas for improvement in Korean."
    },
    parentMessage: { 
      type: Type.STRING, 
      description: "A polite, encouraging letter to parents in Korean." 
    },
    difficultyStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING }, // "상", "중", "하"
          total: { type: Type.NUMBER },
          correct: { type: Type.NUMBER }
        }
      }
    },
    questionTypeStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING }, // "객관식", "서술형"
          total: { type: Type.NUMBER },
          correct: { type: Type.NUMBER }
        }
      }
    },
    assessmentStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          maxScore: { type: Type.NUMBER },
          earnedScore: { type: Type.NUMBER }
        }
      },
      description: "Score breakdown by unit/chapter."
    },
    radarStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          student: { type: Type.NUMBER },
          fullMark: { type: Type.NUMBER }
        }
      }
    },
    incorrectAnswers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.STRING },
          topic: { type: Type.STRING },
          reason: { type: Type.STRING },
          solution: { type: Type.STRING }
        }
      }
    }
  }
};

export async function generateReportAnalysis(data: Partial<ReportData>): Promise<Partial<ReportData>> {
  // Directly use process.env.API_KEY as per strict guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `
      You are an expert academic advisor. Generate a detailed student report card analysis based on the provided data.
      The output must be in Korean.
      
      IMPORTANT REQUIREMENTS:
      1. **Exam Summary (시험 총평)**: Summarize the student's performance.
      2. **Difficulty Analysis (시험 난이도 분석)**: Analyze the **OBJECTIVE difficulty** of the exam paper itself.
      3. **Radar Analysis (5대 역량 분석)**: Write a specific analysis based on the 'Radar Stats'. Highlight the highest scores as strengths and lowest as areas to improve. Suggest how to balance them.
      4. **Parent Message (부모님께)**: Encouraging letter.
      
      Student Data:
      Name: ${data.studentName}
      Score: ${data.score}
      Assessment/Topic Stats: ${JSON.stringify(data.assessmentStats)}
      Difficulty Stats: ${JSON.stringify(data.difficultyStats)}
      Question Type Stats: ${JSON.stringify(data.questionTypeStats)}
      Radar Stats: ${JSON.stringify(data.radarStats)}
      Incorrect Answers: ${JSON.stringify(data.incorrectAnswers)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
      },
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text) as Partial<ReportData>;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

export async function analyzeExamFromImage(base64Image: string, mimeType: string, context: string = ""): Promise<Partial<ReportData>> {
  // Directly use process.env.API_KEY as per strict guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      Analyze this exam paper (image or document) and generate a structured report.
      The output must be in Korean.
      
      Tasks:
      1. Identify Student Info & Score.
      2. **Difficulty Analysis**: Estimate the OBJECTIVE difficulty of the exam questions.
      3. Assessment Stats: Breakdown by Unit/Topic.
      4. **Question Type Stats**: Breakdown by Objective (객관식) vs Subjective (서술형) questions.
      5. Radar Stats: Evaluate student skills (0-100) in 5 areas (e.g. Calculation, Logic).
      6. **Radar Analysis**: Provide a specific commentary on the student's 5 core competencies based on your evaluation.
      
      Context from user: ${context}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
      },
    });

    const text = response.text;
    if (!text) return {};

    return JSON.parse(text) as Partial<ReportData>;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}