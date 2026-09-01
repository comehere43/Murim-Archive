import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import ProfileModal from "../components/ProfileModal";
import KeeperDialogueBox from "../components/KeeperDialogueBox";

import { getProfile, type Profile } from "../api/profile";

import {
  getUnseenProfileTitles,
  markProfileTitleAsSeen,
  type ProfileTitle,
} from "../api/titles";

import {
  getUnseenRealmEvents,
  markRealmEventAsSeen,
  type ProfileRealmEvent,
} from "../api/realms";

import type { KeeperDialogue } from "../types/keeperDialogue";

import {
  createBookCompletionDialogues,
  createKeeperEventQueue,
  createRealmDialogues,
  createTitleDialogues,
} from "../utils/keeperEvents";

import {
  getUnseenBookCompletionEvents,
  markBookCompletionEventAsSeen,
  type BookCompletionEvent,
} from "../api/completions";

function KeeperPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [unseenTitles, setUnseenTitles] = useState<ProfileTitle[]>([]);
  const [unseenRealms, setUnseenRealms] = useState<ProfileRealmEvent[]>([]);
  const [unseenCompletions, setUnseenCompletions] = useState<
    BookCompletionEvent[]
  >([]);

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

  useEffect(() => {
    async function loadKeeperData() {
      try {
        const [
          profileData,
          unseenTitleData,
          unseenRealmData,
          unseenCompletionData,
        ] = await Promise.all([
          getProfile(),
          getUnseenProfileTitles(),
          getUnseenRealmEvents(),
          getUnseenBookCompletionEvents(),
        ]);

        setProfile(profileData);
        setUnseenTitles(unseenTitleData);
        setUnseenRealms(unseenRealmData);
        setUnseenCompletions(unseenCompletionData);
      } catch (error) {
        console.error("서고지기 정보를 불러오지 못했습니다.", error);
      }
    }

    loadKeeperData();
  }, []);

  const keeperEvents = useMemo(
    () => createKeeperEventQueue(unseenTitles, unseenRealms, unseenCompletions),
    [unseenTitles, unseenRealms, unseenCompletions],
  );

  const currentEvent = keeperEvents[currentEventIndex];

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

  const eventDialogues: KeeperDialogue[] = currentEvent
    ? currentEvent.type === "title"
      ? createTitleDialogues(currentEvent.data, position, currentEventIndex)
      : currentEvent.type === "realm_up"
        ? createRealmDialogues(
            currentEvent.data,
            position,
            currentEventIndex,
            keeperEvents,
          )
        : createBookCompletionDialogues(
            currentEvent.data,
            position,
            currentEventIndex,
            keeperEvents,
          )
    : [];

  const activeDialogue =
    currentEvent && eventDialogues.length > 0
      ? eventDialogues[currentDialogueIndex]
      : normalDialogue;

  async function handleDialogueNext() {
    if (!currentEvent) {
      return;
    }

    if (currentDialogueIndex < eventDialogues.length - 1) {
      setCurrentDialogueIndex((current) => current + 1);
      return;
    }

    try {
      if (currentEvent.type === "title") {
        await markProfileTitleAsSeen(currentEvent.data.title_key);
      } else if (currentEvent.type === "realm_up") {
        await markRealmEventAsSeen(currentEvent.data.realm_key);
      } else {
        await markBookCompletionEventAsSeen(currentEvent.data.book_id);
      }

      setCurrentEventIndex((current) => current + 1);
      setCurrentDialogueIndex(0);
    } catch (error) {
      console.error(error);
      alert("이벤트 확인 처리에 실패했습니다.");
    }
  }

  const dialogueButtonLabel =
    currentDialogueIndex < eventDialogues.length - 1
      ? "다음"
      : currentEventIndex < keeperEvents.length - 1
        ? "다음 소식"
        : "확인";

  return (
    <main>
      <h1>서고지기</h1>

      <KeeperDialogueBox
        dialogue={activeDialogue}
        onNext={currentEvent ? handleDialogueNext : undefined}
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
