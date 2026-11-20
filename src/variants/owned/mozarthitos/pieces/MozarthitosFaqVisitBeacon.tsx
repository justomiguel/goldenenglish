"use client";

import { useEffect } from "react";
import { postFaqMetric } from "@/variants/owned/mozarthitos/pieces/postFaqMetric";

/** Count one person when the question list mounts. The server keeps one row per day. */
export function MozarthitosFaqVisitBeacon() {
  useEffect(() => {
    postFaqMetric({ kind: "visit", questionId: null });
  }, []);
  return null;
}
