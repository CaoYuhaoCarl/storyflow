import { useQuery } from "@tanstack/react-query";
import { getReport, listInputs, listReports } from "../lib/api";

export function useReports() {
  return useQuery({ queryKey: ["reports"], queryFn: listReports });
}

export function useReport(filename: string | undefined) {
  return useQuery({
    queryKey: ["report", filename],
    queryFn: () => getReport(filename!),
    enabled: !!filename,
  });
}

export function useInputs() {
  return useQuery({ queryKey: ["inputs"], queryFn: listInputs });
}
