import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import ProfileModal from "../components/ProfileModal";
import KeeperDialogueBox from "../components/KeeperDialogueBox";

import { getProfile, type Profile } from "../api/profile";

import {
  getUnseenProfileTitles,
  markProfileTitleAsSeen,
  type ProfileTitle,
} from "../api/titles";

import {
  CONTINUATION_TITLE_EVENT_LINES,
  getFirstTitleEventLine,
  getTitleAcquiredLine,
  TITLE_DEFINITIONS,
} from "../utils/titleDefinitions";

import type { KeeperDialogue } from "../types/keeperDialogue";

function KeeperPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [unseenTitles, setUnseenTitles] = useState<ProfileTitle[]>([]);

  // 현재 몇 번째 칭호 이벤트인지
  const [currentTitleEventIndex, setCurrentTitleEventIndex] = useState(0);

  // 현재 칭호 이벤트 안에서 몇 번째 대사를 보고 있는지
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

  useEffect(() => {
    async function loadKeeperData() {
      try {
        const [profileData, unseenTitleData] = await Promise.all([
          getProfile(),
          getUnseenProfileTitles(),
        ]);

        setProfile(profileData);
        setUnseenTitles(unseenTitleData);
      } catch (error) {
        console.error("서고지기 정보를 불러오지 못했습니다.", error);
      }
    }

    loadKeeperData();
  }, []);

  const currentTitleEvent = unseenTitles[currentTitleEventIndex];

  const position = profile?.position ?? "주인";

  const normalDialogue: KeeperDialogue = {
    id: "normal-greeting",
    eventType: "normal",
    speaker: "서고지기",
    text: profile
      ? `${profile.sect}의 ${profile.position}, ${profile.name}님을 뵙습니다!`
      : "무엇을 도와드릴까요?",
    expression: "normal",
  };

  const titleDialogues: KeeperDialogue[] = currentTitleEvent
    ? [
        {
          id: `${currentTitleEvent.title_key}-opening`,
          eventType: "title",
          speaker: "서고지기",
          text:
            currentTitleEventIndex === 0
              ? getFirstTitleEventLine(position)
              : CONTINUATION_TITLE_EVENT_LINES[
                  (currentTitleEventIndex - 1) %
                    CONTINUATION_TITLE_EVENT_LINES.length
                ],
          expression: "surprised",
        },

        {
          id: `${currentTitleEvent.title_key}-rumor`,
          eventType: "title",
          speaker: "서고지기",
          text:
            TITLE_DEFINITIONS[currentTitleEvent.title_key]?.rumor(position) ??
            "강호에 새로운 이야기가 퍼지고 있다 하옵니다.",
          expression: "normal",
        },

        {
          id: `${currentTitleEvent.title_key}-acquired`,
          eventType: "title",
          speaker: "서고지기",
          text: getTitleAcquiredLine(currentTitleEvent.title_key, position),
          expression: "happy",
        },
      ]
    : [];

  const activeDialogue =
    currentTitleEvent && titleDialogues.length > 0
      ? titleDialogues[currentDialogueIndex]
      : normalDialogue;

  async function handleDialogueNext() {
    if (!currentTitleEvent) {
      return;
    }

    // 아직 현재 칭호의 다음 대사가 남아 있는 경우
    if (currentDialogueIndex < titleDialogues.length - 1) {
      setCurrentDialogueIndex((current) => current + 1);
      return;
    }

    // 현재 칭호의 마지막 대사까지 본 경우
    try {
      await markProfileTitleAsSeen(currentTitleEvent.title_key);

      // 다음 칭호로 이동
      setCurrentTitleEventIndex((current) => current + 1);

      // 다음 칭호는 다시 첫 대사부터
      setCurrentDialogueIndex(0);
    } catch (error) {
      console.error(error);
      alert("칭호 확인 처리에 실패했습니다.");
    }
  }

  const dialogueButtonLabel =
    currentDialogueIndex < titleDialogues.length - 1
      ? "다음"
      : currentTitleEventIndex < unseenTitles.length - 1
        ? "다음 소문"
        : "확인";

  return (
    <main>
      <h1>서고지기</h1>

      <KeeperDialogueBox
        dialogue={activeDialogue}
        onNext={currentTitleEvent ? handleDialogueNext : undefined}
        nextLabel={dialogueButtonLabel}
      />

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
