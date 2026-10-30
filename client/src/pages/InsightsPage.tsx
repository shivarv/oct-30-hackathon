import { Card } from '../components/Card'
import { DrainsSwaps } from '../components/DrainsSwaps'
import { Factors } from '../components/Factors'
import { MoodChart } from '../components/MoodChart'
import { MoodHero } from '../components/MoodHero'
import { Persona } from '../components/Persona'
import { Suggestions } from '../components/Suggestions'
import type { Insights } from '../types'

export function InsightsPage({ insights }: { insights: Insights }) {
  if (!insights.summary.count) {
    return (
      <Card>
        <p className="py-10 text-center text-ink-3">Check in a few times to see your insights here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <MoodHero summary={insights.summary} trend={insights.trend} />
      <Card title="Mood over time" subtitle="Hover a day to see how it went and what you did">
        <MoodChart trend={insights.trend} />
      </Card>
      <Card title="✨ Changes to try" subtitle="Ranked by how much they lifted your mood on past days">
        <Suggestions suggestions={insights.suggestions} />
      </Card>
      <Card title="🔄 What drains you vs what to try instead" subtitle="Numbers show how many points your mood changes on days with each activity">
        <DrainsSwaps swaps={insights.swaps} drains={insights.drains} boosts={insights.boosts} />
      </Card>
      <Card>
        <Persona persona={insights.persona} />
      </Card>
      <Card title="What affects your mood" subtitle="Average mood on days with vs without each factor">
        <Factors factors={insights.factors} />
      </Card>
    </div>
  )
}
