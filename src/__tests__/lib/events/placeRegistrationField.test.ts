import { describe, expect, it } from "vitest";
import {
  flowFieldContainerId,
  placeRegistrationField,
  SHARED_FIELD_CONTAINER,
} from "@/lib/events/placeRegistrationField";

const academy = flowFieldContainerId("flow-a");

describe("placeRegistrationField", () => {
  it("moves an extra into the flow it is dropped on and takes it out of the shared container", () => {
    const next = placeRegistrationField({
      containers: {
        [SHARED_FIELD_CONTAINER]: ["base:firstName", "field:school"],
        [academy]: ["field:instrument"],
      },
      activeId: "field:school",
      overId: academy,
    });
    expect(next?.[SHARED_FIELD_CONTAINER]).toEqual(["base:firstName"]);
    expect(next?.[academy]).toEqual(["field:instrument", "field:school"]);
  });

  it("puts an extra back in the shared container when dropped there", () => {
    const next = placeRegistrationField({
      containers: {
        [SHARED_FIELD_CONTAINER]: ["base:email"],
        [academy]: ["field:school"],
      },
      activeId: "field:school",
      overId: "base:email",
    });
    expect(next?.[SHARED_FIELD_CONTAINER]).toEqual(["field:school", "base:email"]);
    expect(next?.[academy]).toEqual([]);
  });

  it("leaves a default question in the shared container", () => {
    expect(
      placeRegistrationField({
        containers: {
          [SHARED_FIELD_CONTAINER]: ["base:phone"],
          [academy]: [],
        },
        activeId: "base:phone",
        overId: academy,
      }),
    ).toBeNull();
  });
});
