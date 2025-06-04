import { useState } from "react";
import { CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface AnswerRevealScreenProps {
  url: string | null,
  answer: string | null
}


const AnswerRevealScreen: React.FC<AnswerRevealScreenProps> = ({ url, answer }) => {
  // 模擬數據
  const showAnswer = true
  const questionData = {
    originalImage: url,
    correctAnswer: answer,
    questionText: "這是什麼動漫？"
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <Card className="w-full max-w-6xl shadow-2xl border-0 bg-white">
        <CardHeader className="text-center py-12">
          <div className="mx-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center shadow-lg mb-8">
            {showAnswer ? (
              <CheckCircle className="w-16 h-16 text-white" />
            ) : (
              <Eye className="w-16 h-16 text-white animate-pulse" />
            )}
          </div>
          <CardTitle className="text-5xl font-bold text-slate-800 mb-6">
            {showAnswer ? "正確答案公佈" : "準備公佈答案"}
          </CardTitle>
          <p className="text-2xl text-slate-600">
            {questionData.questionText}
          </p>
        </CardHeader>

        <CardContent className="px-16 pb-16 space-y-12">
          {/* 題目圖片和答案區域 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 原始圖片 */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-slate-700 text-center">
                題目圖片
              </h3>
              <div className="relative">
                <img
                  src={questionData.originalImage}
                  alt="題目圖片"
                  className="w-full h-80 object-cover rounded-2xl shadow-lg border-4 border-slate-200"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/90 text-slate-800">
                    原始圖片
                  </Badge>
                </div>
              </div>
            </div>

            {/* 正確答案 */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-slate-700 text-center">
                正確答案
              </h3>
              <div className="bg-slate-50 rounded-2xl p-12 text-center border-4 border-slate-200 shadow-lg">
                {showAnswer ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-8xl font-bold text-slate-800 mb-6">
                      {questionData.correctAnswer}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xl px-6 py-3 bg-green-50 text-green-700 border-green-300"
                    >
                      ✓ 正確答案
                    </Badge>
                  </div>
                ) : (
                  <div className="text-6xl text-slate-400 animate-pulse">
                    ???
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 額外資訊 */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnswerRevealScreen;