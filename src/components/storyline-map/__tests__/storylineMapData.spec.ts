import { initialNodes, getPathBreakdown } from "../storylineMapData";
import { resolveTimingData } from "../timing";

const getNodeData = (id: string) => {
  const node = initialNodes.find((entry) => entry.id === id);

  if (!node) {
    throw new Error(`Node not found: ${id}`);
  }

  return node.data as Record<string, unknown>;
};

describe("storyline map patch sync", () => {
  it("applies the reduced storyline craft durations to hardcoded map nodes", () => {
    expect(getNodeData("tg-48").craftHours).toBe(25);
    expect(getNodeData("sl-5").craftHours).toBe(3);
    expect(getNodeData("tg-50").craftHours).toBe(23.5);
    expect(getNodeData("build-72-savior").craftHours).toBe(43);
    expect(getNodeData("final-craft-savior").craftHours).toBe(5.5);
    expect(getNodeData("fail-savior").craftHours).toBe(5.5);
    expect(getNodeData("build-72-fallen").craftHours).toBe(43);
    expect(getNodeData("final-craft-fallen").craftHours).toBe(5.5);
    expect(getNodeData("fail-fallen").craftHours).toBe(5.5);
    expect(getNodeData("tg-24b").craftHours).toBe(6);
  });

  it("stores ranged waits for the patched decision-map timers", () => {
    const mechanicWait = getNodeData("tg-24");
    const trustedContactWait = getNodeData("tg-48b");

    expect(mechanicWait.timeGateHours).toBe(12);
    expect(mechanicWait.timeGateHoursMax).toBe(24);
    expect(trustedContactWait.timeGateHours).toBe(24);
    expect(trustedContactWait.timeGateHoursMax).toBe(48);
  });

  it("aggregates ranged waits as min-max totals in the path breakdown", () => {
    const breakdown = getPathBreakdown(
      initialNodes.filter((node) => node.id === "tg-24" || node.id === "tg-48b")
    );

    expect(breakdown.totalTimeGateHours).toBe(36);
    expect(breakdown.totalTimeGateHoursMax).toBe(72);
    expect(breakdown.totalCraftHours).toBe(0);
  });

  it("prefers explicit timing fields over fallback text parsing", () => {
    const timing = resolveTimingData({
      description: "Wait 48 hours for someone to respond",
      isTimeGate: true,
      timeGateHours: 12,
      timeGateHoursMax: 24,
    });

    expect(timing).toMatchObject({
      isTimeGate: true,
      timeGateHours: 12,
      timeGateHoursMax: 24,
    });
  });
});
