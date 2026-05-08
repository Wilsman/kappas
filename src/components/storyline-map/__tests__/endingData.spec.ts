import { endingInfos, getEndingPathData } from "../endingData";

const endingIds = ["survivor", "savior", "fallen", "debtor"] as const;

describe("ending path layout", () => {
  it.each(endingIds)(
    "keeps %s route edges flowing downward with readable spacing",
    (endingId) => {
      const { nodes, edges } = getEndingPathData(endingId);
      const positions = new Map(
        nodes.map((node) => [node.id, node.position] as const)
      );

      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);

      for (const edge of edges) {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);

        expect(source).toBeDefined();
        expect(target).toBeDefined();
        expect(target!.y - source!.y).toBeGreaterThanOrEqual(80);
      }
    }
  );

  it("keeps Savior's pvp and pve split on separate horizontal lanes", () => {
    const { nodes, edges } = getEndingPathData("savior");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );
    const edgeIds = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

    expect(positions.get("pvp")?.x).toBeLessThan(positions.get("pve")?.x ?? 0);
    expect(positions.has("kill-5-no-scav")).toBe(true);
    expect(edgeIds.has("pve->kill-5-no-scav")).toBe(true);
    expect(edgeIds.has("kill-5-no-scav->btr-04")).toBe(true);
  });

  it("keeps the Survivor path on a centered single spine", () => {
    const { nodes } = getEndingPathData("survivor");
    const uniqueX = new Set(nodes.map((node) => node.position.x));

    expect(uniqueX.size).toBe(1);
    expect([...uniqueX][0]).toBe(0);
  });

  it("keeps wait steps below their preceding action nodes in filtered routes", () => {
    const { nodes } = getEndingPathData("debtor");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );

    expect(positions.get("tg-24")?.y).toBeGreaterThan(
      positions.get("wt-keycard")?.y ?? 0
    );
  });

  it("keeps practical ending guidance aligned with the known route costs", () => {
    const endings = new Map(endingInfos.map((ending) => [ending.id, ending]));

    expect(endings.get("survivor")?.requirementHighlights.join(" ")).toContain(
      "300 million or 500 million roubles"
    );
    expect(endings.get("survivor")?.routeNote).toContain("500m");
    expect(endings.get("survivor")?.routeNote).toContain("300m");
    expect(endings.get("survivor")?.terminalAccessCost).toContain("5 million");
    expect(endings.get("survivor")?.playerGuidance).toContain("Avoid");

    expect(endings.get("savior")?.requirementHighlights.join(" ")).toContain(
      "every other storyline chapter"
    );
    expect(endings.get("savior")?.terminalAccessCost).toContain(
      "Blank RFID Card"
    );
    expect(endings.get("savior")?.playerGuidance).toContain("ALL");

    expect(endings.get("fallen")?.requirementHighlights.join(" ")).toContain(
      "1,000,000 USD"
    );
    expect(endings.get("fallen")?.terminalAccessCost).toContain(
      "keycard again"
    );
    expect(endings.get("fallen")?.playerGuidance).toContain("very expensive");

    const debtorText = [
      ...(endings.get("debtor")?.requirementHighlights ?? []),
      endings.get("debtor")?.terminalAccessCost ?? "",
    ].join(" ");

    expect(debtorText).toContain("Blue Folder");
    expect(debtorText).toContain("30 PMC kills on Woods");
    expect(debtorText).toContain("100 dogtags");
    expect(debtorText).toContain("marked room");
    expect(debtorText).toContain("amulets");
  });
});
