interface SiteSetupWizardErrorAlertProps {
  message: string;
}

export function SiteSetupWizardErrorAlert({
  message,
}: SiteSetupWizardErrorAlertProps) {
  return (
    <p
      className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--vw-orange-50)] px-3 py-2 text-sm text-[var(--color-error)]"
      role="alert"
    >
      {message}
    </p>
  );
}
