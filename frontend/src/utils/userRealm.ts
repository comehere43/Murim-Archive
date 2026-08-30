export type UserRealmInfo = {
  realm: string;
  nextRealm: string | null;
  progress: number;
};

const REALMS = [
  { name: "삼류", minPages: 0 },
  { name: "이류", minPages: 500 },
  { name: "일류", minPages: 1500 },
  { name: "절정", minPages: 3000 },
  { name: "초절정", minPages: 6000 },
  { name: "화경", minPages: 10000 },
  { name: "현경", minPages: 15000 },
];

export function getUserRealm(totalReadPages: number): UserRealmInfo {
  let currentIndex = 0;

  for (let i = 0; i < REALMS.length; i += 1) {
    if (totalReadPages >= REALMS[i].minPages) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const currentRealm = REALMS[currentIndex];
  const nextRealm = REALMS[currentIndex + 1];

  if (!nextRealm) {
    return {
      realm: currentRealm.name,
      nextRealm: null,
      progress: 100,
    };
  }

  const pagesInCurrentRealm = totalReadPages - currentRealm.minPages;

  const pagesNeededForNextRealm = nextRealm.minPages - currentRealm.minPages;

  const progress = Math.floor(
    (pagesInCurrentRealm / pagesNeededForNextRealm) * 100,
  );

  return {
    realm: currentRealm.name,
    nextRealm: nextRealm.name,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
