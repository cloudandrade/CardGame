import type { BattleLogEntry, LogUnitRef } from "@/lib/battle/log";
import { sideTag } from "@/lib/battle/log";
import type { Row } from "@/lib/types";

function unitColor(row: Row): string {
  return row === "player" ? "text-emerald-400" : "text-red-400";
}

function UnitName({ unit }: { unit: LogUnitRef }) {
  return (
    <>
      <span className="text-zinc-500">{sideTag(unit.row)} </span>
      <span className={`font-medium ${unitColor(unit.row)}`}>{unit.name}</span>
    </>
  );
}

export function BattleLogLine({ entry }: { entry: BattleLogEntry }) {
  switch (entry.kind) {
    case "meta":
    case "result":
      return <p className="text-zinc-400">{entry.message}</p>;
    case "round":
      return <p className="font-medium text-zinc-300">—— Rodada {entry.round} ——</p>;
    case "enchant":
      return (
        <p>
          <UnitName unit={entry.source} /> encantou <UnitName unit={entry.target} />{" "}
          <span className="text-amber-300">+{entry.amount} ATK</span>
        </p>
      );
    case "heal":
      return (
        <p>
          <UnitName unit={entry.target} /> curou{" "}
          <span className="text-emerald-400">+{entry.amount} PV</span>
        </p>
      );
    case "block":
      return (
        <p>
          <UnitName unit={entry.target} /> bloqueou{" "}
          <span className="text-sky-300">{entry.amount}</span> de dano de{" "}
          <UnitName unit={entry.source} />
        </p>
      );
    case "damage":
      return (
        <p>
          <UnitName unit={entry.target} /> recebeu{" "}
          <span className="text-orange-300">{entry.amount}</span> de dano de{" "}
          <UnitName unit={entry.source} />
        </p>
      );
    case "death":
      return (
        <p>
          <UnitName unit={entry.unit} /> morreu.
        </p>
      );
    default:
      return null;
  }
}
