import type { KeeperDialogue } from "../types/keeperDialogue";

type KeeperDialogueBoxProps = {
  dialogue: KeeperDialogue;
  onNext?: () => void;
  nextLabel?: string;
};

function KeeperDialogueBox({
  dialogue,
  onNext,
  nextLabel = "다음",
}: KeeperDialogueBoxProps) {
  return (
    <section className="keeper-dialogue-box">
      <div className="keeper-dialogue-speaker">{dialogue.speaker}</div>

      <p className="keeper-dialogue-text">{dialogue.text}</p>

      {onNext && (
        <button type="button" onClick={onNext} className="keeper-dialogue-next">
          {nextLabel}
        </button>
      )}
    </section>
  );
}

export default KeeperDialogueBox;
