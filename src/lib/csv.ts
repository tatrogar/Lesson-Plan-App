import Papa from "papaparse";
import type { Word } from "../types";

type Row = Record<string, string>;

export type CsvImportResult = {
  words: Word[];
  errors: string[];
};

function pick(row: Row, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return "";
}

export function parseCsv(text: string): CsvImportResult {
  const result = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const errors: string[] = result.errors.map(
    (e) => `Row ${e.row ?? "?"}: ${e.message}`,
  );
  const words: Word[] = [];

  result.data.forEach((row, idx) => {
    const numStr = pick(row, ["number", "num", "#"]);
    const english = pick(row, ["english", "en"]);
    const spanish = pick(row, ["spanish", "es"]);
    const pos = pick(row, ["pos", "part of speech", "part_of_speech"]);
    const category = pick(row, ["category", "cat"]);
    const example = pick(row, ["example", "ex", "sentence"]);

    if (!english && !spanish) return;

    const number = parseInt(numStr, 10);
    const finalNumber = Number.isFinite(number) ? number : idx + 1;

    if (!english || !spanish) {
      errors.push(
        `Row ${idx + 2}: missing ${!english ? "english" : "spanish"}`,
      );
      return;
    }

    words.push({
      id: `w-${finalNumber}`,
      number: finalNumber,
      english,
      spanish,
      pos,
      category,
      example,
    });
  });

  return { words, errors };
}
