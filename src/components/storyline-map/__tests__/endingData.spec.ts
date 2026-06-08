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

  it("shows Survivor's case choice and payment branches", () => {
    const { nodes, edges } = getEndingPathData("survivor");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );
    const edgeIds = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

    expect(positions.get("keep-self")?.x).toBeLessThan(
      positions.get("give-prapor-0")?.x ?? 0
    );
    expect(positions.get("prapor-comp")?.x).toBe(
      positions.get("give-prapor-0")?.x
    );
    expect(positions.get("armored-hands")?.x).toBe(0);
    expect(positions.has("prapor-comp")).toBe(true);
    expect(positions.has("lk-case")).toBe(true);
    expect(positions.has("sl-300")).toBe(true);
    expect(positions.has("sl-500")).toBe(true);
    expect(positions.has("sl-48")).toBe(true);
    expect(edgeIds.has("recover->keep-self")).toBe(true);
    expect(edgeIds.has("recover->give-prapor-0")).toBe(true);
    expect(edgeIds.has("sl-key-fail->sl-300")).toBe(true);
    expect(edgeIds.has("sl-key-fail->sl-500")).toBe(true);
    expect(edgeIds.has("sl-500->sl-tg")).toBe(true);
    expect(edgeIds.has("sl-48->sl-note")).toBe(true);
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

  it("shows Debtor's initial case choice as a split that converges again", () => {
    const { nodes, edges } = getEndingPathData("debtor");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );
    const edgeIds = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

    expect(positions.get("keep-self")?.x).toBeLessThan(
      positions.get("give-prapor-0")?.x ?? 0
    );
    expect(positions.get("prapor-comp")?.x).toBe(
      positions.get("give-prapor-0")?.x
    );
    expect(positions.get("armored-hands")?.x).toBe(0);
    expect(positions.has("prapor-comp")).toBe(true);
    expect(positions.has("lk-case")).toBe(true);
    expect(edgeIds.has("recover->keep-self")).toBe(true);
    expect(edgeIds.has("recover->give-prapor-0")).toBe(true);
    expect(edgeIds.has("keep-self->armored-hands")).toBe(true);
    expect(edgeIds.has("lk-case->armored-hands")).toBe(true);
  });

  it("shows Savior's case choice and pvp/pve branches", () => {
    const { nodes, edges } = getEndingPathData("savior");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );
    const edgeIds = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

    expect(positions.get("keep-self")?.x).toBeLessThan(
      positions.get("give-prapor-0")?.x ?? 0
    );
    expect(positions.get("prapor-comp")?.x).toBe(
      positions.get("give-prapor-0")?.x
    );
    expect(positions.get("armored-hands")?.x).toBe(0);
    expect(positions.has("prapor-comp")).toBe(true);
    expect(positions.has("lk-case")).toBe(true);
    expect(positions.get("pvp")?.x).toBeLessThan(positions.get("pve")?.x ?? 0);
    expect(edgeIds.has("recover->keep-self")).toBe(true);
    expect(edgeIds.has("recover->give-prapor-0")).toBe(true);
    expect(edgeIds.has("pvp->coop")).toBe(true);
    expect(edgeIds.has("pve->kill-5-no-scav")).toBe(true);
  });

  it("shows Fallen's case choice and case-back branches", () => {
    const { nodes, edges } = getEndingPathData("fallen");
    const positions = new Map(
      nodes.map((node) => [node.id, node.position] as const)
    );
    const edgeIds = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));

    expect(positions.get("keep-self")?.x).toBeLessThan(
      positions.get("give-prapor-0")?.x ?? 0
    );
    expect(positions.get("prapor-comp")?.x).toBe(
      positions.get("give-prapor-0")?.x
    );
    expect(positions.get("armored-hands")?.x).toBe(0);
    expect(positions.has("prapor-comp")).toBe(true);
    expect(positions.has("lk-case")).toBe(true);
    expect(positions.has("case-back")).toBe(true);
    expect(positions.has("no-case-back")).toBe(true);
    expect(edgeIds.has("talk-prapor->case-back")).toBe(true);
    expect(edgeIds.has("talk-prapor->no-case-back")).toBe(true);
    expect(edgeIds.has("case-back->bio-case")).toBe(true);
    expect(edgeIds.has("military-50->bio-case")).toBe(true);
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
