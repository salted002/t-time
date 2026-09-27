import { GradeDistributionChart } from '@/components/charts/GradeDistributionChart'
import { ScoreCompareChart } from '@/components/charts/ScoreCompareChart'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'

export function ChartsDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ScoreCompareChart
        data={[
          { subject: '문법', personal: 18, average: 15.2 },
          { subject: 'Reading', personal: 22, average: 19.8 },
          { subject: 'Listening', personal: 20, average: 17.1 },
          { subject: '어휘', personal: null, average: 16.4 },
        ]}
      />
      <ScoreTrendChart
        title="문법 · 최근 6회 추이"
        series={['personal', 'average']}
        data={[
          { label: '04.01', personal: 14, average: 13.5 },
          { label: '05.01', personal: 15, average: 14.2 },
          { label: '06.01', personal: null, average: 14.0 },
          { label: '07.01', personal: 17, average: 14.8 },
          { label: '08.01', personal: 16, average: 15.0 },
          { label: '09.01', personal: 18, average: 15.2 },
        ]}
      />
      <ScoreTrendChart
        title="반 평균 추이 (시험 상세용, 선 1개)"
        series={['average']}
        data={[
          { label: '07.01', average: 14.8 },
          { label: '08.01', average: 15.0 },
          { label: '09.01', average: 15.2 },
        ]}
      />
      <GradeDistributionChart
        data={[
          { grade: 'A', count: 5 },
          { grade: 'B', count: 9 },
          { grade: 'C', count: 6 },
          { grade: 'D', count: 2 },
        ]}
      />
    </div>
  )
}
