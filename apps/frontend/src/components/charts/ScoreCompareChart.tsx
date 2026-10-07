import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import { ChartCard, ChartSummary } from '@/components/charts/ChartCard'
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
  average: { label: '시험 평균', color: 'var(--chart-4)' },
} satisfies ChartConfig

interface LabelProps {
  x?: number | string
  y?: number | string
  width?: number | string
  value?: number | string | null
  index?: number
}

const mean = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? nums.reduce((sum, v) => sum + v, 0) / nums.length : null
}
const round1 = (n: number) => Math.round(n * 10) / 10

interface ScoreCompareChartProps {
  data: ScoreCompareDatum[]
  title?: string
}

export function ScoreCompareChart({
  data,
  title = '과목별 개인 점수 vs 시험 평균',
}: ScoreCompareChartProps) {
  const personalMean = mean(data.map((d) => d.personal))
  const averageMean = mean(data.map((d) => d.average))
  const isBelow = (d?: ScoreCompareDatum) =>
    !!d && d.personal !== null && d.average !== null && d.personal < d.average
  const lowerSubjects = data.filter(isBelow).map((d) => d.subject)

  let summary = null
  if (personalMean !== null) {
    const diff = averageMean === null ? null : round1(personalMean - averageMean)
    summary = (
      <ChartSummary
        value={round1(personalMean)}
        unit="점"
        chip={diff === null ? undefined : `시험 평균보다 ${diff > 0 ? '+' : ''}${diff}`}
        tone={diff !== null && diff < 0 ? 'destructive' : 'brand'}
        sub={
          lowerSubjects.length === 0
            ? '모든 과목이 시험 평균 이상이에요'
            : `${lowerSubjects.join(', ')} 과목이 시험 평균보다 낮아요`
        }
      />
    )
  }

  return (
    <ChartCard
      title={title}
      summary={summary}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart
            data={data}
            barGap={4}
            barCategoryGap="30%"
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="compare-personal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--chart-1)' }} />
                <stop
                  offset="1"
                  style={{ stopColor: 'color-mix(in oklab, var(--chart-1) 70%, black)' }}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
            <ChartLegend
              verticalAlign="top"
              align="right"
              itemSorter={null}
              content={<ChartLegendContent verticalAlign="top" />}
            />
            <Bar
              dataKey="personal"
              fill="url(#compare-personal)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            >
              <LabelList
                dataKey="personal"
                content={(props) => {
                  const { x, y, width, value, index } = props as unknown as LabelProps
                  if (value === null || value === undefined || value === '') return null
                  return (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - 6}
                      textAnchor="middle"
                      fontSize={12.5}
                      fontWeight={700}
                      className={isBelow(data[index ?? 0]) ? 'fill-destructive' : 'fill-foreground'}
                    >
                      {value}
                    </text>
                  )
                }}
              />
            </Bar>
            <Bar
              dataKey="average"
              fill="var(--color-average)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            >
              <LabelList
                dataKey="average"
                position="top"
                offset={6}
                fontSize={11.5}
                className="fill-muted-foreground"
              />
            </Bar>
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
