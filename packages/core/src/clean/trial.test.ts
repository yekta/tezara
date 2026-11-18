import assert from "node:assert/strict";
import { test } from "node:test";
import { currentYear, isTrialThesis } from "./trial.ts";

const NOV_2026 = new Date("2026-11-18T12:00:00Z");

test("a year after the current one is a trial, the current year is not", () => {
  assert.equal(isTrialThesis({ title_original: "Gerçek bir tez", year: 2027 }, NOV_2026), true);
  assert.equal(isTrialThesis({ title_original: "Gerçek bir tez", year: 2026 }, NOV_2026), false);
  assert.equal(
    isTrialThesis({ title_original: "Gerçek bir tez", year: 2027 }, new Date("2027-01-02T00:00:00Z")),
    false,
    "the same year becomes valid once it arrives",
  );
});

test("the year rolls over on Istanbul time", () => {
  assert.equal(currentYear(new Date("2026-12-31T20:59:00Z")), 2026);
  assert.equal(currentYear(new Date("2026-12-31T21:01:00Z")), 2027);
});

test("placeholder titles are trials regardless of casing, digits and punctuation", () => {
  for (const title of [
    "DENEME 2",
    "Deneme",
    "daha sonra doldurulacaktır",
    "Daha sonra doldurulacaktır.",
    "TEST",
    "Deneme Tezi 3",
  ]) {
    assert.equal(isTrialThesis({ title_original: title, year: 2024 }, NOV_2026), true, title);
  }
});

test("real titles that merely contain a placeholder word are kept", () => {
  for (const title of [
    "Penetration test",
    "Test durumu önceliklendirme",
    "Yeni Türk edebiyatında bir anlatı türü olarak deneme",
    "Tekrar eden ölçümlü deneme desenleri",
  ]) {
    assert.equal(isTrialThesis({ title_original: title, year: 2024 }, NOV_2026), false, title);
  }
});

test("a missing year is judged on the title alone", () => {
  assert.equal(isTrialThesis({ title_original: "Gerçek bir tez", year: null }, NOV_2026), false);
  assert.equal(isTrialThesis({ title_original: "Deneme", year: null }, NOV_2026), true);
});
