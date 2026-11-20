import { describe, expect, it } from "vitest";
import { orderFaqOpenRows, parseFaqAdminStats } from "@/lib/faq/faqAdminStats";

const items = [
  { id: "price", q: "How much?" },
  { id: "age", q: "What age?" },
];

describe("parseFaqAdminStats", () => {
  it("maps a visit total and open rows", () => {
    expect(
      parseFaqAdminStats({
        visits: 4,
        opens: [{ questionId: "price", count: 2 }],
      }),
    ).toEqual({
      visits: 4,
      opens: [{ questionId: "price", count: 2 }],
    });
  });

  it("rejects a payload that is not the stats object", () => {
    expect(parseFaqAdminStats(null)).toBeNull();
    expect(parseFaqAdminStats("nope")).toBeNull();
    expect(parseFaqAdminStats({ visits: "1", opens: [] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1.5, opens: [] })).toBeNull();
    expect(parseFaqAdminStats({ visits: -1, opens: [] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1 })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [null] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: ["x"] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [{ questionId: 1, count: 1 }] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [{ questionId: "", count: 1 }] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [{ questionId: "price" }] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [{ questionId: "price", count: 1.2 }] })).toBeNull();
    expect(parseFaqAdminStats({ visits: 1, opens: [{ questionId: "price", count: -1 }] })).toBeNull();
  });
});

describe("orderFaqOpenRows", () => {
  it("puts the highest count first and keeps catalog order on a tie", () => {
    expect(
      orderFaqOpenRows(items, [
        { questionId: "age", count: 3 },
        { questionId: "price", count: 1 },
      ]),
    ).toEqual([
      { id: "age", question: "What age?", opens: 3 },
      { id: "price", question: "How much?", opens: 1 },
    ]);
  });

  it("keeps catalog order when the counts match", () => {
    expect(orderFaqOpenRows(items, [])).toEqual([
      { id: "price", question: "How much?", opens: 0 },
      { id: "age", question: "What age?", opens: 0 },
    ]);
  });

  it("shows an unknown id as the label", () => {
    expect(orderFaqOpenRows(items, [{ questionId: "orbit", count: 2 }])[0]).toEqual({
      id: "orbit",
      question: "orbit",
      opens: 2,
    });
  });
});
