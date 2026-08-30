import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import ProfileModal from "../components/ProfileModal";
import { getProfile, type Profile } from "../api/profile";

function KeeperPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("프로필 정보를 불러오지 못했습니다.", error);
      }
    }

    loadProfile();
  }, []);

  return (
    <main>
      <h1>서고지기</h1>

      <p>
        {profile
          ? `${profile.sect}의 ${profile.position}, ${profile.name}님을 뵙습니다!`
          : "무엇을 도와드릴까요?"}
      </p>

      <nav>
        <Link to="/books/add">새 비급 등록</Link>
        <br />
        <Link to="/library">서고 보기</Link>
      </nav>

      <button type="button" onClick={() => setIsProfileOpen(true)}>
        신분패
      </button>

      {isProfileOpen && (
        <ProfileModal
          onClose={async () => {
            setIsProfileOpen(false);

            try {
              const data = await getProfile();
              setProfile(data);
            } catch (error) {
              console.error("프로필 정보를 다시 불러오지 못했습니다.", error);
            }
          }}
        />
      )}
    </main>
  );
}

export default KeeperPage;
