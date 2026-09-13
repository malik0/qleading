import type { JuzMarkersMap } from "../types/quran";
import markerData from "./juzMarkers.json";

// Static timing data lives in JSON; lookup behavior is in ../lib/juzMarkers.ts.
export const JUZ_MARKERS: JuzMarkersMap = markerData;
