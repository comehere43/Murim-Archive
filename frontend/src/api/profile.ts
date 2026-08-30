import { API_BASE_URL } from "../config";

export type Profile = {
  id: number;
  name: string;
  sect: string;
  position: string;
};

export async function getProfile(): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/profile`);

  if (!response.ok) {
    throw new Error("프로필 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function updateProfile(
  name: string,
  sect: string,
  position: string,
): Promise<Profile> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      sect,
      position,
    }),
  });

  if (!response.ok) {
    throw new Error("프로필 정보를 수정하지 못했습니다.");
  }

  return response.json();
}
