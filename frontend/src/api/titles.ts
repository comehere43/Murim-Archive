import { API_BASE_URL } from "../config";

export type ProfileTitle = {
  id: number;
  title_key: string;
  acquired_at: string;
  is_seen: boolean;
  is_equipped: boolean;
};

export async function getProfileTitles(): Promise<ProfileTitle[]> {
  const response = await fetch(`${API_BASE_URL}/profile/titles`);

  if (!response.ok) {
    throw new Error("칭호 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function equipProfileTitle(titleKey: string): Promise<{
  title_key: string;
  is_equipped: boolean;
}> {
  const response = await fetch(
    `${API_BASE_URL}/profile/titles/${titleKey}/equip`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("대표 칭호를 변경하지 못했습니다.");
  }

  return response.json();
}

export async function getUnseenProfileTitles(): Promise<ProfileTitle[]> {
  const response = await fetch(`${API_BASE_URL}/profile/titles/unseen`);

  if (!response.ok) {
    throw new Error("새 칭호 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function markProfileTitleAsSeen(
  titleKey: string,
): Promise<ProfileTitle> {
  const response = await fetch(
    `${API_BASE_URL}/profile/titles/${titleKey}/seen`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("칭호 확인 처리를 완료하지 못했습니다.");
  }

  return response.json();
}
