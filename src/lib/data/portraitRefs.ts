/**
 * Maps each person ID to their portrait image path and, where scripture
 * explicitly describes their physical appearance, the source reference.
 *
 * Entries WITHOUT a scriptureRef have no biblical physical description;
 * their portrait is purely an artistic interpretation of the era and role.
 */

import { publicPath } from "@/lib/basePath";

export interface PortraitInfo {
  src: string;
  scriptureRef?: string;
  scriptureDescription?: string;
}

export const PORTRAIT_INFO: Record<string, PortraitInfo> = {
  // ── Physical description confirmed in scripture ────────────────────────────

  esau: {
    src: "/portraits/portrait-esau.png",
    scriptureRef: "Genesis 25:25",
    scriptureDescription: "\"The first to come out was red, and his whole body was like a hairy garment.\"",
  },
  david: {
    src: "/portraits/portrait-david-young.png",
    scriptureRef: "1 Samuel 16:12",
    scriptureDescription: "\"He was glowing with health and had a fine appearance and handsome features\" — described as ruddy (admoni).",
  },
  "joseph-son-of-jacob": {
    src: "/portraits/portrait-joseph-son-of-jacob.png",
    scriptureRef: "Genesis 39:6",
    scriptureDescription: "\"Now Joseph was well-built and handsome\" (yefeh-toar viyefeh mareh — beautiful of form and beautiful of face).",
  },
  absalom: {
    src: "/portraits/portrait-absalom.png",
    scriptureRef: "2 Samuel 14:25-26",
    scriptureDescription: "\"In all Israel there was no one so much to be praised for his beauty as Absalom. From the sole of his foot to the crown of his head there was no blemish in him. And when he cut his hair... he weighed the hair of his head, two hundred shekels.\"",
  },
  rachel: {
    src: "/portraits/portrait-rachel.png",
    scriptureRef: "Genesis 29:17",
    scriptureDescription: "\"Rachel had a lovely figure and was beautiful.\"",
  },
  rebekah: {
    src: "/portraits/portrait-rebekah.png",
    scriptureRef: "Genesis 24:16",
    scriptureDescription: "\"The woman was very beautiful, a virgin; no man had ever slept with her.\"",
  },
  leah: {
    src: "/portraits/portrait-leah.png",
    scriptureRef: "Genesis 29:17",
    scriptureDescription: "\"Leah had weak eyes\" — understood as delicate or tender eyes, contrasted with Rachel's beauty.",
  },
  bathsheba: {
    src: "/portraits/portrait-bathsheba.png",
    scriptureRef: "2 Samuel 11:2",
    scriptureDescription: "\"The woman was very beautiful to look at.\"",
  },
  sarah: {
    src: "/portraits/portrait-sarah.png",
    scriptureRef: "Genesis 12:11",
    scriptureDescription: "\"I know that you are a woman of beautiful appearance.\"",
  },

  // ── No physical description in scripture ──────────────────────────────────

  mary: { src: "/portraits/portrait-mary.png" },
  adam: { src: "/portraits/portrait-adam.png" },
  eve: { src: "/portraits/portrait-eve.png" },
  seth: { src: "/portraits/portrait-seth.png" },
  noah: { src: "/portraits/portrait-noah.png" },
  abraham: { src: "/portraits/portrait-abraham.png" },
  isaac: { src: "/portraits/portrait-isaac.png" },
  jacob: { src: "/portraits/portrait-jacob.png" },
  judah: { src: "/portraits/portrait-judah.png" },
  ruth: { src: "/portraits/portrait-ruth.png" },
  rahab: { src: "/portraits/portrait-rahab.png" },
  tamar: { src: "/portraits/portrait-tamar.png" },
  solomon: { src: "/portraits/portrait-solomon.png" },
  josiah: { src: "/portraits/portrait-josiah.png" },
  jesus: { src: "/portraits/portrait-jesus.png" },
};

export function getPortrait(personId: string): PortraitInfo | null {
  const info = PORTRAIT_INFO[personId];
  if (!info) return null;
  return { ...info, src: publicPath(info.src) };
}
