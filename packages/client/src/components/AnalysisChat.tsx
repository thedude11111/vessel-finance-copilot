import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAnalysisStore } from '@/stores/analysisStore';

interface AnalysisChatProps {
  analysisId: string;
  title: string;
  chatType: 'parameters' | 'results';
}

export function AnalysisChat({ analysisId, title, chatType }: AnalysisChatProps) {
  const [message, setMessage] = useState('');
  const { chatHistory, loading, sendParameterMessage, sendResultsQuestion } = useAnalysisStore();

  const handleSend = () => {
    if (message.trim()) {
      if (chatType === 'parameters') {
        sendParameterMessage(analysisId, message);
      } else {
        sendResultsQuestion(analysisId, message);
      }
      setMessage('');
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.message}
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Input
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}
