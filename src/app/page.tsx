import { loadGraphData } from "@/lib/data/loader";
import AtlasShell from "@/components/atlas/AtlasShell";

export default function HomePage() {
  const data = loadGraphData();
  return <AtlasShell data={data} />;
}
