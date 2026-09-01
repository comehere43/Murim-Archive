import { API_BASE_URL } from "../config";

export type ProfileRealm = {
  realm_key: string;
  realm: string;
  next_realm_key: string | null;
  next_realm: string | null;
  progress: number;
  total_read_pages: number;
};

export async function getProfileRealm(): Promise<ProfileRealm> {
  const response = await fetch(`${API_BASE_URL}/profile/realm`);

  if (!response.ok) {
    throw new Error("경지 정보를 불러오지 못했습니다.");
  }

  return response.json();
}
