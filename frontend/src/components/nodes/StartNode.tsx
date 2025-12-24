import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Clock, Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StartNodeData } from '@/types'

const scheduleIcons = {
  once: Calendar,
  daily: Clock,
  weekly: CalendarDays,
}

const scheduleLabels = {
  once: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
}

export const StartNode = memo(({ data, selected }: NodeProps<StartNodeData>) => {
  const Icon = scheduleIcons[data.scheduleType] || Clock

  return (
    <div
      className={cn(
        'workflow-node node-start min-w-[120px]',
        selected && 'selected'
      )}
    >
      <div className="p-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <div className="node-icon flex h-5 w-5 items-center justify-center rounded">
            <Icon className="h-3 w-3" />
          </div>
          <div>
            <div className="text-xs font-medium leading-tight">Start</div>
            <div className="text-[9px] text-muted-foreground">
              {scheduleLabels[data.scheduleType] || 'Schedule'}
            </div>
          </div>
        </div>
        <div className="rounded bg-muted/50 px-1.5 py-1 text-[10px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Time:</span>
            <span className="mono-data font-medium">{data.time || '09:15'}</span>
          </div>
          {data.scheduleType === 'weekly' && data.days && data.days.length > 0 && (
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-muted-foreground">Days:</span>
              <span className="mono-data text-[9px]">
                {data.days.map((d) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][d]).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bottom-0 !translate-y-1/2"
      />
    </div>
  )
})

StartNode.displayName = 'StartNode'
