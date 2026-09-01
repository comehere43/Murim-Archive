import { useEffect, useState } from "react";
import { getBooks, type Book } from "../api/books";
import { getUserRealm } from "../utils/userRealm";
import { getProfile, updateProfile, type Profile } from "../api/profile";
import {
  equipProfileTitle,
  getProfileTitles,
  type ProfileTitle,
} from "../api/titles";
import { TITLE_DEFINITIONS } from "../utils/titleDefinitions";
import "./ProfileModal.css";

type ProfileModalProps = {
  onClose: () => void;
};

function ProfileModal({ onClose }: ProfileModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [sectInput, setSectInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [titles, setTitles] = useState<ProfileTitle[]>([]);
  const [isTitleListOpen, setIsTitleListOpen] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const [booksData, profileData, titlesData] = await Promise.all([
          getBooks(),
          getProfile(),
          getProfileTitles(),
        ]);

        setBooks(booksData);
        setProfile(profileData);
        setTitles(titlesData);
        setNameInput(profileData.name);
        setSectInput(profileData.sect);
        setPositionInput(profileData.position);
      } catch (error) {
        console.error("신분패 정보를 불러오지 못했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const totalBooks = books.length;

  const completedBooks = books.filter(
    (book) => book.max_read_page >= book.total_pages,
  ).length;

  const totalReadPages = books.reduce(
    (sum, book) => sum + book.max_read_page,
    0,
  );
  const realmInfo = getUserRealm(totalReadPages);
  const equippedTitle = titles.find((title) => title.is_equipped);

  async function handleProfileSave() {
    const trimmedName = nameInput.trim();
    const trimmedSect = sectInput.trim();
    const trimmedPosition = positionInput.trim();

    if (!trimmedName) {
      alert("성명을 입력해주세요.");
      return;
    }

    if (!trimmedSect) {
      alert("문파를 입력해주세요.");
      return;
    }

    if (!trimmedPosition) {
      alert("직책을 입력해주세요.");
      return;
    }

    try {
      const updatedProfile = await updateProfile(
        trimmedName,
        trimmedSect,
        trimmedPosition,
      );

      setProfile(updatedProfile);
      setNameInput(updatedProfile.name);
      setSectInput(updatedProfile.sect);
      setPositionInput(updatedProfile.position);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("신분 정보를 수정하지 못했습니다.");
    }
  }

  function getTitleName(titleKey: string) {
    return TITLE_DEFINITIONS[titleKey]?.name ?? titleKey;
  }

  async function handleEquipTitle(titleKey: string) {
    try {
      await equipProfileTitle(titleKey);

      const updatedTitles = await getProfileTitles();
      setTitles(updatedTitles);
    } catch (error) {
      console.error(error);
      alert("대표 칭호를 변경하지 못했습니다.");
    }
  }

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="profile-modal-close" onClick={onClose} type="button">
          ×
        </button>

        <h2>신분패</h2>

        <div className="profile-info">
          {isEditing ? (
            <>
              <p>
                <strong>성명</strong>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  maxLength={100}
                />
              </p>

              <p>
                <strong>문파</strong>
                <input
                  type="text"
                  value={sectInput}
                  onChange={(event) => setSectInput(event.target.value)}
                  maxLength={100}
                />
              </p>

              <p>
                <strong>직책</strong>
                <input
                  type="text"
                  value={positionInput}
                  onChange={(event) => setPositionInput(event.target.value)}
                  maxLength={100}
                />
              </p>

              <div className="profile-edit-actions">
                <button type="button" onClick={handleProfileSave}>
                  저장
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNameInput(profile?.name ?? "");
                    setSectInput(profile?.sect ?? "");
                    setIsEditing(false);
                    setPositionInput(profile?.position ?? "");
                  }}
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>성명</strong>
                <span>{isLoading ? "..." : (profile?.name ?? "무명")}</span>
              </p>

              <p>
                <strong>문파</strong>
                <span>{isLoading ? "..." : (profile?.sect ?? "무소속")}</span>
              </p>

              <p>
                <strong>직책</strong>
                <span>
                  {isLoading ? "..." : (profile?.position ?? "무직책")}
                </span>
              </p>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                신분 수정
              </button>
            </>
          )}

          <hr />

          <div className="profile-title-row">
            <strong>칭호</strong>

            <span>
              {equippedTitle ? getTitleName(equippedTitle.title_key) : "없음"}
            </span>

            <button
              type="button"
              onClick={() => setIsTitleListOpen(!isTitleListOpen)}
            >
              보유 {titles.length}개 ›
            </button>
          </div>

          {isTitleListOpen && (
            <div className="profile-title-list">
              {titles.length === 0 ? (
                <p>아직 획득한 칭호가 없습니다.</p>
              ) : (
                titles.map((title) => (
                  <button
                    key={title.id}
                    type="button"
                    onClick={() => handleEquipTitle(title.title_key)}
                    disabled={title.is_equipped}
                  >
                    {getTitleName(title.title_key)}
                    {title.is_equipped && " · 대표 칭호"}
                  </button>
                ))
              )}
            </div>
          )}

          <p>
            <strong>경지</strong>
            <span>{isLoading ? "..." : realmInfo.realm}</span>
          </p>

          <div className="realm-progress">
            <div className="realm-progress-bar">
              <div
                className="realm-progress-fill"
                style={{
                  width: `${isLoading ? 0 : realmInfo.progress}%`,
                }}
              />
            </div>

            <span>{isLoading ? "..." : `${realmInfo.progress}%`}</span>
          </div>

          <p>
            <strong>다음 경지</strong>
            <span>
              {isLoading ? "..." : (realmInfo.nextRealm ?? "최고 경지")}
            </span>
          </p>

          <hr />

          <p>
            <strong>소장 비급</strong>
            <span>{isLoading ? "..." : `${totalBooks}권`}</span>
          </p>

          <p>
            <strong>완성 비급</strong>
            <span>{isLoading ? "..." : `${completedBooks}권`}</span>
          </p>

          <p>
            <strong>총 수련량</strong>
            <span>
              {isLoading ? "..." : `${totalReadPages.toLocaleString()}쪽`}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
