import { API_BASE_URL } from "../config";

export type ProfileRealmEvent = {
  id: number;
  realm_key: string;
  realm_name: string;
  acquired_at: string;
  is_seen: boolean;
};

export async function getUnseenRealmEvents(): Promise<ProfileRealmEvent[]> {
  const response = await fetch(`${API_BASE_URL}/profile/realms/unseen`);

  if (!response.ok) {
    throw new Error("경지 상승 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function markRealmEventAsSeen(
  realmKey: string,
): Promise<ProfileRealmEvent> {
  const response = await fetch(
    `${API_BASE_URL}/profile/realms/${realmKey}/seen`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("경지 상승 확인 처리를 완료하지 못했습니다.");
  }

  return response.json();
}
