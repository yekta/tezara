import { TUniversity } from "@/server/clickhouse/repo/university";

export default function getUniversityCardId(university: TUniversity) {
  return `university-${university.name}`;
}
