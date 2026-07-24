"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";

/* ════════════════════ REAL ZERO-CYCLE REFERENCE ══════════════════ */
/* Full community coordinate dataset (per-tower, per-standing-height,    */
/* front/back setups with orientation, player + bed coords, bow notes).  */

interface Setup {
  orient: string;
  player: string;
  bed: string;
  bow?: string;
  anchor?: string;
}
interface Height {
  label: string;
  sort: number;
  front: Setup[];
  back: Setup[];
}
type Category = "small" | "medium" | "tall" | "special";
interface Tower {
  name: string;
  code: string;
  h: number | null;
  category: Category;
  node: string;
  heights: Height[];
}

const TOWERS: Tower[] = [
  {
    name: "Small Boy", code: "S76", h: 76, category: "small", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27", anchor: "An anchor in the bed position breaks crystal" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [] },
    ],
  },
  {
    name: "Small Cage", code: "C79", h: 79, category: "small", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Hybrid Offset (3bo)", player: "26 -27", bed: "26 -29", bow: "with" }, { orient: "Modern Offset (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31", bow: "no" }], back: [{ orient: "Hybrid Offset (3bo)", player: "-27 26", bed: "-27 28", bow: "with" }, { orient: "Modern Offset (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30", bow: "no" }] },
      { label: "Y82", sort: 82, front: [{ orient: "Hybrid Offset (2bo)", player: "27 -27", bed: "27 -29" }], back: [{ orient: "Hybrid Offset (2bo)", player: "-28 26", bed: "-28 28" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [] },
    ],
  },
  {
    name: "Tall Cage", code: "C82", h: 82, category: "small", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y82", sort: 82, front: [{ orient: "Hybrid Offset (4bo)", player: "25 -27", bed: "25 -29", bow: "with" }, { orient: "Modern Offset (5bo)", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32", bow: "no" }], back: [{ orient: "Hybrid Offset (4bo)", player: "-27 26 (multiblock)", bed: "-26 28 & -25 27" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29", anchor: "An anchor in the bed position breaks crystal" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-29 26", bed: "-29 28" }] },
      { label: "Y87", sort: 87, front: [], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [] },
    ],
  },
  {
    name: "M85", code: "M85", h: 85, category: "medium", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Hybrid Offset (4bo)", player: "27 -29 (28 -29 for multi)", bed: "27 -31" }], back: [{ orient: "Hybrid Offset (4bo)", player: "-29 28 (multiblock)", bed: "-28 30 & -27 29" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27", anchor: "An anchor in the bed position breaks crystal" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [] },
    ],
  },
  {
    name: "M88", code: "M88", h: 88, category: "medium", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Hybrid Offset (3bo)", player: "26 -27", bed: "26 -29", bow: "with" }, { orient: "Modern Offset (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31", bow: "no" }], back: [{ orient: "Hybrid Offset (3bo)", player: "-27 26", bed: "-27 28", bow: "with" }, { orient: "Modern Offset (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30", bow: "no" }] },
      { label: "Y91", sort: 91, front: [{ orient: "Hybrid Offset (2bo)", player: "27 -27", bed: "27 -29" }], back: [{ orient: "Hybrid Offset (2bo)", player: "-28 26", bed: "-28 28" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [] },
    ],
  },
  {
    name: "M91", code: "M91", h: 91, category: "medium", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32", bow: "with" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y91", sort: 91, front: [{ orient: "Modern Offset (5bo)", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32", bow: "no" }], back: [] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29", anchor: "An anchor in the bed position breaks crystal" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-29 26", bed: "-29 28" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-29 24", bed: "-29 26" }] },
    ],
  },
  {
    name: "T94", code: "T94", h: 94, category: "tall", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32", anchor: "The top anchor breaks crystal when detonated" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31", anchor: "The top anchor breaks crystal when detonated" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Hybrid Offset (4bo)", player: "26 -28", bed: "26 -30", bow: "with" }, { orient: "Modern Offset (4bo)", player: "28 -29 (multiblock)", bed: "26 -30 & 27 -31", bow: "no" }], back: [{ orient: "Hybrid Offset (4bo)", player: "-27 27", bed: "-27 29", bow: "with" }, { orient: "Modern Offset (4bo)", player: "-30 29 (multiblock)", bed: "-28 30 & -29 31", bow: "no" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid (N/S)", player: "28 -27", bed: "28 -29" }], back: [{ orient: "Hybrid (N/S)", player: "-30 25", bed: "-30 27", anchor: "An anchor in the bed position breaks crystal" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-29 24", bed: "-29 26" }] },
    ],
  },
  {
    name: "T97", code: "T97", h: 97, category: "tall", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Hybrid Offset (3bo)", player: "26 -27", bed: "26 -29", bow: "with" }, { orient: "Modern Offset (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31", bow: "no" }], back: [{ orient: "Hybrid Offset (3bo)", player: "-27 26", bed: "-27 28", bow: "with" }, { orient: "Hybrid Offset (3bo)", player: "-29 27 (multiblock)", bed: "-28 29 & -27 28", bow: "no" }] },
      { label: "Y100", sort: 100, front: [{ orient: "Hybrid Offset (2bo)", player: "27 -27", bed: "27 -29" }], back: [{ orient: "Hybrid Offset (2bo)", player: "-28 26", bed: "-28 28" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-29 24", bed: "-29 26" }] },
      { label: "Y108", sort: 108, front: [{ orient: "Hybrid (N/S)", player: "28 -26", bed: "28 -28" }], back: [] },
    ],
  },
  {
    name: "T100", code: "T100", h: 100, category: "tall", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Universal Side", player: "26 -28 (multiblock)", bed: "25 -30 & 24 -29" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }, { orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }, { orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-29 29 (multiblock)", bed: "-27 30 & -28 31" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y100", sort: 100, front: [{ orient: "Hybrid Offset (4bo)", player: "25 -27", bed: "25 -29", bow: "with" }, { orient: "Modern Offset (5bo)", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32", bow: "no" }], back: [{ orient: "Hybrid Offset (4bo)", player: "-27 26 (multiblock)", bed: "-26 28 & -25 27" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (1bo)", player: "27 -26", bed: "27 -28" }], back: [{ orient: "Hybrid Offset (1bo)", player: "-28 25", bed: "-28 27" }] },
      { label: "Y108", sort: 108, front: [{ orient: "Hybrid (N/S)", player: "28 -26", bed: "28 -28" }], back: [] },
    ],
  },
  {
    name: "Tall Boy", code: "T103", h: 103, category: "tall", node: "Diagonal",
    heights: [
      { label: "Y81", sort: 81, front: [{ orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y86", sort: 86, front: [{ orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y90", sort: 90, front: [{ orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y94", sort: 94, front: [{ orient: "Tall Tower Side (3bo)", player: "29 -29 (multiblock)", bed: "27 -30 & 28 -31" }], back: [{ orient: "Tall Tower Side (3bo)", player: "-30 28 (multiblock)", bed: "-28 29 & -29 30" }] },
      { label: "Y95", sort: 95, front: [{ orient: "Modern Offset (4bo)", player: "29 -30 (multiblock)", bed: "27 -31 & 28 -32" }], back: [{ orient: "Modern Offset (4bo)", player: "-30 29 (multiblock)", bed: "-28 30 & -29 31" }] },
      { label: "Y99", sort: 99, front: [{ orient: "Universal Side", player: "28 -30 (multiblock)", bed: "26 -31 & 27 -32" }], back: [{ orient: "Universal Side", player: "-27 27 (multiblock)", bed: "-26 29 & -25 28" }] },
      { label: "Y104", sort: 104, front: [{ orient: "Hybrid Offset (4bo)", player: "26 -28", bed: "26 -30", bow: "with" }, { orient: "Modern Offset (4bo)", player: "28 -29 (multiblock)", bed: "26 -30 & 27 -31", bow: "no" }], back: [{ orient: "Hybrid Offset (3bo)", player: "-26 25", bed: "-26 27", bow: "with" }, { orient: "Hybrid Offset (4bo)", player: "-28 27 (multiblock)", bed: "-27 29 & -26 28", bow: "no" }] },
      { label: "Y108", sort: 108, front: [{ orient: "Hybrid (N/S)", player: "28 -26", bed: "28 -28" }], back: [] },
    ],
  },
  {
    name: "1/8", code: "1/8", h: null, category: "special", node: "Straight",
    heights: [
      { label: "Y78 / Y79", sort: 78, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y83 / Y84", sort: 83, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y87 / Y88", sort: 87, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y92 / Y93", sort: 92, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y96 / Y97", sort: 96, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y101 / Y102", sort: 101, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [{ orient: "Modern (E/W)", player: "-23 -1", bed: "-21 -1" }] },
      { label: "Y105 / Y106", sort: 105, front: [{ orient: "Modern (E/W)", player: "22 0", bed: "20 0" }], back: [] },
    ],
  },
];

const CATEGORIES: Category[] = ["small", "medium", "tall", "special"];
const CAT_LABEL: Record<Category, string> = {
  small: "Small", medium: "Medium", tall: "Tall", special: "Special",
};

/** Accent color per orientation family. */
function orientColor(orient: string): string {
  if (orient.startsWith("Hybrid (")) return "#b388ff";
  if (orient.startsWith("Modern (")) return "#00e5ff";
  if (orient.includes("Universal Side") || orient.includes("Tall Tower Side")) return "#ffc400";
  if (orient.includes("Offset")) return "#00e676";
  return "#c0c4cc";
}

/* The 4 master dragon pass nodes (canonical reference). */
const MASTER_NODES = [
  { name: "Front Diagonal", block: "28, -27", alt: "or 28, -26", real: "28.5, -26.5", facing: "North", note: "≈45° dragon entry — the standard front node.", color: "#00e676" },
  { name: "Back Diagonal", block: "-30, 25", alt: "or -29, 25", real: "-29.5, 25.5", facing: "South", note: "Mirror of the front diagonal.", color: "#ff5252" },
  { name: "Front 1/8", block: "22, -1", alt: null, real: "22.5, -0.5", facing: "West", note: "Straight / orthogonal pass.", color: "#00e5ff" },
  { name: "Back 1/8", block: "-23, 0", alt: null, real: "-22.5, 0.5", facing: "East", note: "Straight / orthogonal pass.", color: "#b388ff" },
];

const PRO_TIPS = [
  "Set entity distance to 500% before (or as) you enter the End portal.",
  "Timing over damage — a max-damage first bed can break; slightly early keeps height control.",
  "“Multiblock” beds list two coords placed together; “bo” = bed-offset count for the setup.",
  "Practice on Mescht's Zero Practice map or the MCSR Practice Map (/trigger repair, visible nodes).",
];

/* ── Tower profile visualizer ─────────────────────────────────────── */

function TowerProfile({ tower, selectedSort }: { tower: Tower; selectedSort: number }) {
  if (tower.h === null) return null;
  const sy = (y: number) => 330 - (y - 58) * 4.6; // world Y → svg Y
  const topY = sy(tower.h);
  const sel = tower.heights.find((hh) => hh.sort === selectedSort);
  const hasFront = !!sel && sel.front.length > 0;
  const hasBack = !!sel && sel.back.length > 0;

  return (
    <svg viewBox="0 0 175 350" className="w-full">
      <line x1={8} y1={330} x2={167} y2={330} stroke="#26262f" strokeWidth={2} />
      {/* obsidian tower */}
      <rect x={38} y={topY} width={32} height={330 - topY} fill="#171226" stroke="#b388ff" strokeOpacity={0.35} />
      <text x={54} y={topY - 24} textAnchor="middle" fill="#b388ff" fontSize={10} fontFamily="monospace">
        Y{tower.h}
      </text>
      {/* end crystal */}
      <path d={`M54 ${topY - 15} l7 7 -7 7 -7 -7 Z`} fill="#ff5252" fillOpacity={0.25} stroke="#ff5252" strokeWidth={1.5} />
      {tower.category === "small" && tower.code.startsWith("C") && (
        <circle cx={54} cy={topY - 8} r={12} fill="none" stroke="#c0c4cc" strokeWidth={1.2} strokeDasharray="3 3" />
      )}
      {/* bridge-out standing position */}
      <rect x={124} y={sy(selectedSort)} width={14} height={4} fill="#00e5ff" fillOpacity={0.9} />
      <circle cx={131} cy={sy(selectedSort) - 8} r={5} fill="#00e5ff" />
      <text x={131} y={sy(selectedSort) + 16} textAnchor="middle" fill="#00e5ff" fontSize={9} fontFamily="monospace">
        Y{selectedSort}
      </text>
      {/* dragon pass lines through the node (front green / back red) */}
      {hasFront && (
        <line x1={131} y1={sy(selectedSort) - 8} x2={58} y2={topY - 8} stroke="#00e676" strokeWidth={1.3} strokeDasharray="4 4" strokeOpacity={0.8} />
      )}
      {hasBack && (
        <line x1={131} y1={sy(selectedSort) - 8} x2={58} y2={topY - 8} stroke="#ff5252" strokeWidth={1.3} strokeDasharray="2 5" strokeOpacity={0.8} />
      )}
      {/* standing height ticks */}
      {tower.heights.map((hh) => {
        const active = hh.sort === selectedSort;
        return (
          <g key={hh.sort}>
            <line x1={148} y1={sy(hh.sort)} x2={156} y2={sy(hh.sort)} stroke={active ? "#00e5ff" : "#4a4a58"} strokeWidth={2} />
            <text x={159} y={sy(hh.sort) + 3} fill={active ? "#00e5ff" : "#4a4a58"} fontSize={8} fontFamily="monospace">
              {hh.sort}
            </text>
          </g>
        );
      })}
      <text x={54} y={344} textAnchor="middle" fill="#4a4a58" fontSize={8} fontFamily="monospace">TOWER</text>
      <text x={131} y={344} textAnchor="middle" fill="#4a4a58" fontSize={8} fontFamily="monospace">YOU</text>
    </svg>
  );
}

/* ── Setup + cell renderers ───────────────────────────────────────── */

function SetupBlock({ setup }: { setup: Setup }) {
  const color = orientColor(setup.orient);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="chip border"
          style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
        >
          {setup.orient}
        </span>
        {setup.bow && (
          <span className="chip border border-charcoal-500 bg-charcoal-700 text-charcoal-300">
            bow {setup.bow}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="w-9 shrink-0 text-[10px] uppercase tracking-widest text-charcoal-300">You</span>
        <span className="text-sm font-bold tracking-wide text-white">{setup.player}</span>
      </div>
      <div className="flex items-baseline gap-2 font-mono">
        <span className="w-9 shrink-0 text-[10px] uppercase tracking-widest text-charcoal-300">Bed</span>
        <span className="text-xs tracking-wide text-charcoal-300">{setup.bed}</span>
      </div>
      {setup.anchor && (
        <span className="chip border border-accent-red/40 bg-accent-red/10 text-accent-red">
          ⚠ {setup.anchor}
        </span>
      )}
    </div>
  );
}

function SideCell({ setups }: { setups: Setup[] }) {
  if (setups.length === 0) {
    return <span className="font-mono text-charcoal-300">—</span>;
  }
  return (
    <div className="space-y-3">
      {setups.map((s, i) => (
        <div key={i} className={i > 0 ? "border-t border-charcoal-600/50 pt-3" : ""}>
          <SetupBlock setup={s} />
        </div>
      ))}
    </div>
  );
}

/* ── Tower cheat sheet (table GUI) ────────────────────────────────── */

function TowerSheet() {
  const [tower, setTower] = useState<Tower>(TOWERS[0]);
  const [selSort, setSelSort] = useState<number | null>(null);
  const selectedSort = selSort ?? tower.heights[0].sort;

  const pickTower = (t: Tower) => {
    setTower(t);
    setSelSort(null);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Tower-by-Tower Standing Setups</h2>
          <p className="text-xs text-charcoal-300">
            Real player + bed block coordinates per tower — verify with{" "}
            <span className="font-mono text-white">targeted block coords</span> (F3 right side), not player coords.
          </p>
        </div>
        <span className="chip border border-accent-purple/40 bg-accent-purple/10 text-accent-purple">
          {tower.node} node
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[180px_1fr_180px]">
        {/* Tower selector */}
        <nav className="space-y-4 border-b border-charcoal-500/60 p-4 lg:border-b-0 lg:border-r">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <div className="mb-1.5 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal-300">
                {CAT_LABEL[c]}
              </div>
              <div className="space-y-1">
                {TOWERS.filter((t) => t.category === c).map((t) => {
                  const active = tower.code === t.code;
                  return (
                    <button
                      key={t.code}
                      onClick={() => pickTower(t)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-300 ${
                        active
                          ? "border-accent-green/60 bg-accent-green/10 font-semibold text-accent-green"
                          : "border-charcoal-500/50 bg-charcoal-700/40 text-charcoal-300 hover:border-charcoal-400 hover:text-white"
                      }`}
                    >
                      {t.name}
                      {t.h !== null && (
                        <span className="font-mono text-[10px] opacity-70">Y{t.h}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Angle table */}
        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold text-white">{tower.name}</h3>
            {tower.code !== tower.name && (
              <span className="font-mono text-sm text-charcoal-300">({tower.code})</span>
            )}
            {tower.h !== null && (
              <span className="chip border border-charcoal-500 bg-charcoal-700 text-charcoal-300">
                H: {tower.h}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-charcoal-500/60">
                  <th className="w-28 px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-tight tracking-widest text-charcoal-300">
                    Standing<br />Height
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-green">
                    Front
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-red">
                    Back
                  </th>
                </tr>
              </thead>
              <tbody>
                {tower.heights.map((hh) => {
                  const active = hh.sort === selectedSort;
                  return (
                    <tr
                      key={hh.sort}
                      onClick={() => setSelSort(hh.sort)}
                      className={`cursor-pointer border-b border-charcoal-600/40 align-top transition-colors duration-300 ${
                        active ? "bg-accent-teal/10" : "hover:bg-charcoal-700/40"
                      }`}
                    >
                      <td className="whitespace-nowrap bg-accent-amber/5 px-3 py-4 font-mono text-sm font-bold text-accent-amber">
                        {hh.label}
                        {active && <span className="ml-1.5 text-accent-blue">◂</span>}
                      </td>
                      <td className="px-3 py-4"><SideCell setups={hh.front} /></td>
                      <td className="px-3 py-4"><SideCell setups={hh.back} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
            values are x · z block coords — click a row to preview the line-up
          </p>
        </div>

        {/* Profile */}
        <div className="hidden border-l border-charcoal-500/60 p-4 lg:block">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal-300">
            {tower.h !== null ? "Line-up preview" : "1/8 straight node"}
          </div>
          {tower.h !== null ? (
            <TowerProfile tower={tower} selectedSort={selectedSort} />
          ) : (
            <p className="text-xs leading-relaxed text-charcoal-300">
              The 1/8 setup applies when the dragon flies straight (orthogonal)
              rather than diagonally. Coordinates are constant across every
              standing height — build out to the E/W straight node.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Master nodes panel ───────────────────────────────────────────── */

function MasterNodes() {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">The 4 Master Dragon Pass Nodes</h2>
          <p className="text-xs text-charcoal-300">
            Every setup bridges out to one of these intersection nodes to maximize explosive damage.
          </p>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {MASTER_NODES.map((n) => (
          <div
            key={n.name}
            className="rounded-xl border border-charcoal-500/60 bg-charcoal-900/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-charcoal-400"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: n.color }} />
              <span className="text-sm font-semibold text-white">{n.name}</span>
            </div>
            <div className="font-mono text-xl font-black" style={{ color: n.color }}>
              {n.block}
            </div>
            {n.alt && <div className="font-mono text-xs text-charcoal-300">{n.alt}</div>}
            <div className="mt-2 space-y-1 font-mono text-xs text-charcoal-300">
              <div>real {n.real}</div>
              <div>
                facing <span className="font-bold text-white">{n.facing}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-charcoal-300">{n.note}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-charcoal-500/60 px-5 py-4">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
          Pro consistency tips
        </div>
        <ul className="grid gap-1.5 text-xs leading-relaxed text-charcoal-300 sm:grid-cols-2">
          {PRO_TIPS.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-accent-green">▸</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ════════════════════════ MODULE ROOT ════════════════════════════ */

export default function ZeroCycleTrainer() {
  return (
    <>
      <PageHeader
        title="Zero-Cycle Reference"
        subtitle="Real player + bed coordinates for every End tower and standing height — diagonal and 1/8 straight setups."
        right={
          <span className="chip border border-accent-purple/40 bg-accent-purple/10 text-accent-purple">
            Full Coord Sheet
          </span>
        }
      />
      <div className="space-y-6">
        <TowerSheet />
        <MasterNodes />
      </div>
    </>
  );
}
