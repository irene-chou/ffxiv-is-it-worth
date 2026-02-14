interface Props {
  error: unknown;
}

export function ErrorMessage({ error }: Props) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="rounded-lg bg-red-900/20 border border-red-800/40 p-4 text-red-300">
      <p className="font-medium">出事了 💀</p>
      <p className="text-sm mt-1 text-red-400">{message}</p>
    </div>
  );
}
