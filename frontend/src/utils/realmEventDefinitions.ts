export function getFirstRealmEventLine(position: string) {
  return `${position}님, 기운이 심상치 않사옵니다.`;
}

export const CONTINUATION_REALM_EVENT_LINES = [
  "놀랍게도 기세가 아직 가라앉지 않았사옵니다.",
  "상승한 기운이 다시 한번 요동치고 있사옵니다.",
  "아직 끝이 아니옵니다. 또 한 번 벽을 넘으셨사옵니다.",
  "기세가 연이어 치솟고 있사옵니다.",
];

export function getRealmAcquiredLine(position: string, realmName: string) {
  return `${position}님께서 마침내 「${realmName}」의 경지에 오르셨사옵니다!`;
}
