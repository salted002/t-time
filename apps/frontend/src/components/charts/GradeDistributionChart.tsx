import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'

import { ChartCard, ChartSummary } from '@/components/charts/ChartCard'
import {
  ChartContainer,
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

export interface GradeDistributionDatum {
  grade: string
  count: number
}

const config = {
  count: { label: '인원', color: 'var(--chart-1)' },
} satisfies ChartConfig

// 최다 등급이 아닌 막대는 옅은 초록
const MUTED_BAR = 'color-mix(in oklab, var(--chart-1) 28%, white)'

interface LabelProps {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string | null
  index?: number
}

interface GradeDistributionChartProps {
  data: GradeDistributionDatum[]
  title?: string
}

export function GradeDistributionChart({ data, title = '등급 분포' }: GradeDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(0, ...data.map((d) => d.count))
  const peakIndex = maxCount > 0 ? data.findIndex((d) => d.count === maxCount) : -1

  const summary =
    peakIndex >= 0 ? (
      <ChartSummary
        value={data[peakIndex].grade}
        chip={`${maxCount}명 · ${Math.round((maxCount / total) * 100)}%`}
        tone="gold"
        sub={`응시 ${total}명 중 가장 많은 등급`}
      />
    ) : null

  return (
    <ChartCard
      title={title}
      summary={summary}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="grade-peak" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0"
                  style={{ stopColor: 'color-mix(in oklab, var(--chart-3) 80%, white)' }}
                />
                <stop
                  offset="1"
                  style={{ stopColor: 'color-mix(in oklab, var(--chart-3) 85%, black)' }}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="grade" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {data.map((d, i) => (
                <Cell key={d.grade} fill={i === peakIndex ? 'url(#grade-peak)' : MUTED_BAR} />
              ))}
              <LabelList
                dataKey="count"
                content={(props) => {
                  const { x, y, width, height, value, index } = props as unknown as LabelProps
                  const cx = Number(x) + Number(width) / 2
                  const isPeak = index === peakIndex
                  return (
                    <g>
                      <text
                        x={cx}
                        y={Number(y) - 7}
                        textAnchor="middle"
                        fontSize={isPeak ? 13 : 12}
                        fontWeight={isPeak ? 700 : 500}
                        className={isPeak ? 'fill-foreground' : 'fill-muted-foreground'}
                      >
                        {value}명
                      </text>
                      {isPeak && Number(height) >= 30 && (
                        <>
                          <rect
                            x={cx - 17}
                            y={Number(y) + 9}
                            width={34}
                            height={18}
                            rx={9}
                            fill="white"
                            fillOpacity={0.3}
                          />
                          <text
                            x={cx}
                            y={Number(y) + 22}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={700}
                            fill="oklch(0.3 0.06 85)"
                          >
                            최다
                          </text>
                        </>
                      )}
                    </g>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>등급</TableHead>
              <TableHead className="text-right">인원</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.grade}>
                <TableCell>{d.grade}</TableCell>
                <TableCell className="text-right">{d.count}명</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  )
}
