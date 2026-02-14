interface Props {
  error: unknown;
}

export function ErrorMessage({ error }: Props) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
      <p className="font-medium">發生錯誤</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}
