import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartCard } from '@/components/charts/ChartCard'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface ScoreCompareDatum {
  subject: string
  personal: number | null
  average: number | null
}

const config = {
  personal: { label: '내 점수', color: 'var(--chart-1)' },
  average: { label: '시험 평균', color: 'var(--chart-2)' },
} satisfies ChartConfig

interface ScoreCompareChartProps {
  data: ScoreCompareDatum[]
  title?: string
}

export function ScoreCompareChart({
  data,
  title = '과목별 개인 점수 vs 시험 평균',
}: ScoreCompareChartProps) {
  return (
    <ChartCard
      title={title}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart
            data={data}
            barGap={2}
            barCategoryGap="30%"
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <Bar
              dataKey="personal"
              fill="var(--color-personal)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="average"
              fill="var(--color-average)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>과목</TableHead>
              <TableHead className="text-right">내 점수</TableHead>
              <TableHead className="text-right">시험 평균</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.subject}>
                <TableCell>{d.subject}</TableCell>
                <TableCell className="text-right">{d.personal ?? '-'}</TableCell>
                <TableCell className="text-right">{d.average ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  )
}
