import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'

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

export interface ScoreTrendDatum {
  /** x축 이름 (예: '09.01' 또는 '9월 정기') */
  label: string
  personal?: number | null
  average?: number | null
}

type Series = 'personal' | 'average'

const LABELS: Record<Series, string> = { personal: '내 점수', average: '반 평균' }

// 비교용(보조) 선 색
const GRAY = 'oklch(0.76 0.02 88)'

interface DotProps {
  cx?: number | null
  cy?: number | null
  index?: number
  value?: number | null
}

const round1 = (n: number) => Math.round(n * 10) / 10
const nonNull = (v: number | null | undefined): v is number => v !== null && v !== undefined

interface ScoreTrendChartProps {
  data: ScoreTrendDatum[]
  /** 그릴 선. 학생 상세: ['personal'], 리포트: ['personal', 'average'], 시험 상세: ['average'] */
  series: Series[]
  title: string
}

export function ScoreTrendChart({ data, series, title }: ScoreTrendChartProps) {
  // 주인공 선: 내 점수가 있으면 내 점수, 없으면 첫 번째 선 (초록 + 영역 채움)
  const main: Series = series.includes('personal') ? 'personal' : series[0]
  const others = series.filter((key) => key !== main)

  const config = {
    personal: { label: LABELS.personal, color: 'var(--chart-1)' },
    average: { label: LABELS.average, color: main === 'average' ? 'var(--chart-1)' : GRAY },
  } satisfies ChartConfig

  // 주인공 선의 마지막 점 (골드 강조 + 말풍선)
  const lastIndex = data.reduce((acc, d, i) => (nonNull(d[main]) ? i : acc), -1)

  const renderMainDot = (props: unknown) => {
    const { cx, cy, index, value } = props as DotProps
    if (cx == null || cy == null || value == null) return <g key={`dot-${index}`} />
    if (index === lastIndex) {
      return (
        <g key={`dot-${index}`}>
          <circle
            cx={cx}
            cy={cy}
            r={11}
            fill="none"
            stroke="var(--chart-3)"
            strokeOpacity={0.35}
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="var(--chart-3)"
            stroke="var(--card)"
            strokeWidth={3}
          />
          <rect x={cx - 20} y={cy - 40} width={40} height={24} rx={7} fill="var(--chart-5)" />
          <path d={`M${cx - 5},${cy - 16} l5,5 l5,-5 Z`} fill="var(--chart-5)" />
          <text x={cx} y={cy - 23} textAnchor="middle" fontSize={13} fontWeight={700} fill="white">
            {value}
          </text>
        </g>
      )
    }
    return (
      <g key={`dot-${index}`}>
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="var(--card)"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          className="fill-foreground"
        >
          {value}
        </text>
      </g>
    )
  }

  const renderSubDot = (props: unknown) => {
    const { cx, cy, index, value } = props as DotProps
    if (cx == null || cy == null || value == null) return <g key={`sub-${index}`} />
    return (
      <circle
        key={`sub-${index}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="var(--card)"
        stroke={GRAY}
        strokeWidth={2}
      />
    )
  }

  // 상단 요약: 주인공 선의 마지막 값, 직전 대비 증감, (있으면) 반 평균과의 차이
  const values = data.map((d) => d[main]).filter(nonNull)
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  const avgValues = data.map((d) => d.average).filter(nonNull)
  const avgLast = avgValues[avgValues.length - 1]

  let summary = null
  if (last !== undefined) {
    const delta = prev === undefined ? null : round1(last - prev)
    let sub: string | undefined
    if (main === 'personal' && avgLast !== undefined) {
      const gap = round1(last - avgLast)
      sub =
        gap === 0
          ? `반 평균(${round1(avgLast)}점)과 같아요`
          : `반 평균(${round1(avgLast)}점)보다 ${Math.abs(gap)}점 ${gap > 0 ? '높아요' : '낮아요'}`
    }
    summary = (
      <ChartSummary
        value={round1(last)}
        unit="점"
        chip={
          delta === null
            ? undefined
            : delta === 0
              ? '전회와 같음'
              : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}점 전회 대비`
        }
        tone={delta !== null && delta < 0 ? 'destructive' : 'brand'}
        sub={sub}
      />
    )
  }

  return (
    <ChartCard
      title={title}
      summary={summary}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} margin={{ top: 40, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="1" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[
                (dataMin: number) => Math.max(0, Math.floor((dataMin - 10) / 10) * 10),
                (dataMax: number) => Math.ceil((dataMax + 5) / 10) * 10,
              ]}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            {series.length > 1 && (
              <ChartLegend
                verticalAlign="top"
                align="right"
                itemSorter={null}
                content={<ChartLegendContent verticalAlign="top" />}
              />
            )}
            <Area
              dataKey={main}
              type="monotone"
              stroke="none"
              fill="url(#trend-area)"
              activeDot={false}
              legendType="none"
              tooltipType="none"
              connectNulls={false}
            />
            {others.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={renderSubDot}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
            <Line
              dataKey={main}
              type="monotone"
              stroke={`var(--color-${main})`}
              strokeWidth={3}
              dot={renderMainDot}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </ComposedChart>
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
