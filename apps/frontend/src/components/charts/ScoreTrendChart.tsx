import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

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

export interface ScoreTrendDatum {
  /** x축 이름 (예: '09.01' 또는 '9월 정기') */
  label: string
  personal?: number | null
  average?: number | null
}

type Series = 'personal' | 'average'

const LABELS: Record<Series, string> = { personal: '내 점수', average: '반 평균' }

const config = {
  personal: { label: LABELS.personal, color: 'var(--chart-1)' },
  average: { label: LABELS.average, color: 'var(--chart-2)' },
} satisfies ChartConfig

interface ScoreTrendChartProps {
  data: ScoreTrendDatum[]
  /** 그릴 선. 학생 상세: ['personal'], 리포트: ['personal', 'average'], 시험 상세: ['average'] */
  series: Series[]
  title: string
}

export function ScoreTrendChart({ data, series, title }: ScoreTrendChartProps) {
  return (
    <ChartCard
      title={title}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            {series.length > 1 && (
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            )}
            {series.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                strokeDasharray={key === 'average' ? '4 4' : undefined}
                dot={{ r: 4, strokeWidth: 2, strokeDasharray: '0', fill: 'var(--card)' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시험</TableHead>
              {series.map((key) => (
                <TableHead key={key} className="text-right">
                  {LABELS[key]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.label}>
                <TableCell>{d.label}</TableCell>
                {series.map((key) => (
                  <TableCell key={key} className="text-right">
                    {d[key] ?? '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  )
}
