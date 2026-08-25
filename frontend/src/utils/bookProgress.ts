export function getBookRealm(maxReadPage: number, totalPages: number): string {
  if (totalPages <= 0) {
    return "초입";
  }

  const progress = (maxReadPage / totalPages) * 100;

  if (progress >= 100) {
    return "완성";
  }

  if (progress >= 90) {
    return "원만";
  }

  if (progress >= 60) {
    return "대성";
  }

  if (progress >= 30) {
    return "소성";
  }

  if (progress >= 10) {
    return "입문";
  }

  return "초입";
}
