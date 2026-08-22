import { TSubjectStat } from "@/server/clickhouse/repo/subject";

export default function getSubjectCardId(subject: TSubjectStat) {
  return `subject-${subject.name}`;
}
