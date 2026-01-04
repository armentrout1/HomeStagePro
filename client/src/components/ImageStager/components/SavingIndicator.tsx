interface SavingIndicatorProps {
  isSaving: boolean;
}

export function SavingIndicator({ isSaving }: SavingIndicatorProps) {
  if (!isSaving) {
    return null;
  }

  return (
    <div className="text-center mt-4 text-sm text-gray-500 flex items-center justify-center">
      <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
      Saving image to gallery...
    </div>
  );
}
