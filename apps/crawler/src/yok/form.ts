/**
 * The exact SearchTez form contract, verified against the live site.
 *
 * Three fields the previous crawler never sent are mandatory — omitting any of them
 * returns YÖK's "Geçersiz sorgulama" error page:
 *   islem=2 · -find="  Bul" · uni_group=on
 *
 * Durum=0 ("Tümü") matters just as much: the form's own default of 3 ("Onaylandı")
 * hides 133,788 records (11.7%), including numbered theses such as 151.
 */
export type SearchForm = Record<string, string>;

export function baseForm(overrides: Partial<SearchForm> = {}): SearchForm {
  return {
    uniad: "", Universite: "", uni_yoksis_id: "", source: "TR", uni_group: "on",
    ensad: "", Enstitu: "0", abdad: "", ABD: "", Konu: "",
    Tur: "0", Dil: "0", izin: "0", Durum: "0", Bolum: "0",
    yil1: "1", yil2: "9999",
    TezAd: "", AdSoyad: "", DanismanAdSoyad: "", Dizin: "", TezNo: "", Metin: "",
    islem: "2", "-find": "  Bul",
    ...overrides,
  };
}

export function byTezNo(id: number): SearchForm {
  if (!Number.isInteger(id) || id < 1) {
    // YÖK silently DROPS an unparseable TezNo and returns the whole corpus
    // truncated to 2000 rows, so a bad id must never reach the wire.
    throw new Error(`TezNo must be a positive integer, got ${id}`);
  }
  return baseForm({ TezNo: String(id) });
}
