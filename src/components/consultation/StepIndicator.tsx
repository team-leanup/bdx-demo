import { cn } from '@/lib/cn';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div
            key={step}
            className={cn(
              'rounded-full transition-all duration-300',
              isCurrent
                ? 'w-6 h-2 bg-primary'
                : isCompleted
                ? 'w-2 h-2 bg-gray-400'
                : 'w-2 h-2 bg-border',
            )}
          />
        );
      })}
    </div>
  );
}
