interface Props {
  isLoadingRecipes: boolean;
  isLoadingPrices: boolean;
}

export function LoadingState({ isLoadingRecipes, isLoadingPrices }: Props) {
  let message = '載入中...';
  if (isLoadingRecipes) message = '正在抓取配方資料...';
  else if (isLoadingPrices) message = '正在抓取市場價格...';

  return (
    <div className="flex items-center gap-3 py-8 justify-center text-gray-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      <span>{message}</span>
    </div>
  );
}
