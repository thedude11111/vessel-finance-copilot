import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResultsGraphsProps {
  chartData: any[]; // TODO: Define a proper type for chart data
}

export function ResultsGraphs({ chartData }: ResultsGraphsProps) {
  if (!chartData || chartData.length === 0) {
    return <p>No data to display in charts.</p>;
  }

  // Assuming chartData is an array of objects, where each object has a 'name' and other data keys
  const dataKeys = Object.keys(chartData[0]).filter(key => key !== 'name');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Projections</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line key={index} type="monotone" dataKey={key} stroke={`hsl(${index * 60}, 80%, 50%)`} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
