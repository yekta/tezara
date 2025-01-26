import { TUniversity } from "@/server/clickhouse/repo/universities";

export default function getUniversityCardId(university: TUniversity) {
  return `university-${university.name}`;
}
