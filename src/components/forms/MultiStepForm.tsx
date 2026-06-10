"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  title: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isLastStep: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

export function MultiStepForm({
  steps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isLastStep,
  isSubmitting,
  children,
}: MultiStepFormProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="hidden sm:flex justify-between">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`text-xs ${i <= currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[300px]">{children}</div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={currentStep === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {isLastStep ? (
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </Button>
        ) : (
          <Button onClick={onNext}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
