import { Suspense } from 'react'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { Card } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Analytics & Insights</h1>
        <p className="text-gray-600 mt-1">
          View attendance trends, demographics, and member engagement
        </p>
      </div>

      <Suspense 
        fallback={
          <Card className="p-8 text-center text-gray-600">
            Loading analytics...
          </Card>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
