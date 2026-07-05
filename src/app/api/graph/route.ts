import { NextResponse } from "next/server";
import { loadGraphData } from "@/lib/data/loader";

export async function GET() {
  const data = loadGraphData();
  return NextResponse.json(data);
}
