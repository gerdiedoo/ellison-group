import { neighborhoodCounts } from "@/lib/data";
import { NeighborhoodExplorer } from "@/components/neighborhood-explorer";
export const metadata = { title: "Little Rock neighborhoods" };
export default async function Neighborhoods() {
  return <NeighborhoodExplorer counts={await neighborhoodCounts()} />;
}
