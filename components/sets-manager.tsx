"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"

interface Set {
  setNumber: number
  reps?: number
  weightLbs?: string
}

interface SetsManagerProps {
  exerciseIndex: number
  sets: Set[]
  onSetsChange: (exerciseIndex: number, sets: Set[]) => void
  disabled?: boolean
}

export function SetsManager({ exerciseIndex, sets, onSetsChange, disabled = false }: SetsManagerProps) {
  const addSet = () => {
    const newSets = [...sets, {
      setNumber: sets.length + 1,
      reps: undefined,
      weightLbs: undefined
    }]
    onSetsChange(exerciseIndex, newSets)
  }

  const removeSet = (setIndex: number) => {
    if (sets.length === 1) return // Keep at least one set

    const newSets = sets
      .filter((_, index) => index !== setIndex)
      .map((set, index) => ({ ...set, setNumber: index + 1 })) // Re-number sets

    onSetsChange(exerciseIndex, newSets)
  }

  const updateSet = (setIndex: number, field: 'reps' | 'weightLbs', value: string) => {
    const newSets = [...sets]
    if (field === 'reps') {
      newSets[setIndex] = {
        ...newSets[setIndex],
        reps: value === '' ? undefined : parseInt(value)
      }
    } else {
      newSets[setIndex] = {
        ...newSets[setIndex],
        weightLbs: value === '' ? undefined : value
      }
    }
    onSetsChange(exerciseIndex, newSets)
  }

  return (
    <div className="space-y-2">
      {/* Add Set Button */}
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-muted-foreground">
          Sets ({sets.length})
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSet}
          disabled={disabled}
          className="h-8 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Set
        </Button>
      </div>

      {/* Sets List */}
      <div className="space-y-2">
        {sets.map((set, setIndex) => (
          <div key={setIndex} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
            {/* Set Number Label */}
            <div className="w-12 text-xs font-medium text-muted-foreground">
              Set {set.setNumber}
            </div>

            {/* Reps Input */}
            <div className="flex-1">
              <Label htmlFor={`exercise-${exerciseIndex}-set-${setIndex}-reps`} className="text-xs text-muted-foreground">
                Reps
              </Label>
              <Input
                id={`exercise-${exerciseIndex}-set-${setIndex}-reps`}
                type="number"
                min="0"
                max="1000"
                placeholder="Reps"
                value={set.reps ?? ''}
                onChange={(e) => updateSet(setIndex, 'reps', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>

            {/* Weight Input */}
            <div className="flex-1">
              <Label htmlFor={`exercise-${exerciseIndex}-set-${setIndex}-weight`} className="text-xs text-muted-foreground">
                Weight (lbs)
              </Label>
              <Input
                id={`exercise-${exerciseIndex}-set-${setIndex}-weight`}
                type="text"
                placeholder="Weight"
                value={set.weightLbs ?? ''}
                onChange={(e) => updateSet(setIndex, 'weightLbs', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
                pattern="^\d*\.?\d*$"
              />
            </div>

            {/* Remove Set Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSet(setIndex)}
              disabled={disabled || sets.length === 1}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
