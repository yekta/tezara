/** Shape of the tezBilgiDetay.jsp JSON response. Parsing/cleaning lives in @tezara/core. */
export type DetailPayload = {
  danisman?: string;
  yer?: string;
  trOzet?: string;
  enOzet?: string;
  anahtarKelimeTr?: string;
  anahtarKelimeEn?: string;
};
