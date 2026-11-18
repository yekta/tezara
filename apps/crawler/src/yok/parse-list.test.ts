import assert from "node:assert/strict";
import { test } from "node:test";
import { parseList } from "./parse-list.ts";

const page = (title: string) => `
  <div class="result-card" data-index="0" data-kayitno="k1" data-tezno="t1">
    <div class="card-title">${title}</div>
    <div class="card-info"><strong>Tez No:</strong> 333830</div>
  </div>
  <script>
    var referenceData = {
      "0": {
        "meta": {
          "author": "EMİNE ELİF EROL",
          "year": "2013",
          "subject": "Hukuk",
          "type": "Yüksek Lisans",
          "lang": "Türkçe",
          "title": "${title}"
        }
      },
    };
  </script>`;

test("reads metadata when the title carries raw control characters", () => {
  const [row] = parseList(page("Marka hakkına tecavüz hali\u0002nde açılabi\u0002lecek davalar\u0000"));
  assert.deepEqual(
    { author: row?.author, year: row?.year, thesis_type: row?.thesis_type, language: row?.language },
    { author: "EMİNE ELİF EROL", year: 2013, thesis_type: "Yüksek Lisans", language: "Türkçe" },
  );
});
