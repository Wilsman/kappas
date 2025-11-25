import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import type { Connection, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import StoryNode from "./components/StoryNode";
import DecisionNode from "./components/DecisionNode";
import EndingNode from "./components/EndingNode";
import CostPanel from "./components/CostPanel";

const nodeTypes = {
  story: StoryNode,
  decision: DecisionNode,
  ending: EndingNode,
};

// Layout constants for better alignment
const ROW_HEIGHT = 120;
const COL_WIDTH = 280;

// Initial nodes based on the Tarkov storyline
const initialNodes: Node[] = [
  // ============ ROW 0: Starting point (TOP) ============
  {
    id: "start",
    type: "decision",
    position: { x: 0, y: 0 },
    data: {
      label: "The Armored Case",
      description: "Your ticket out of Tarkov - What do you do?",
      isIrreversible: true,
    },
  },

  // ============ ROW 1: Initial choice ============
  {
    id: "give-prapor",
    type: "story",
    position: { x: -COL_WIDTH, y: ROW_HEIGHT },
    data: {
      label: "Give Case to Prapor",
      description: "Unlocks 'The Ticket' quest - Recommended path",
      isIrreversible: true,
      isCompleted: true,
    },
  },
  {
    id: "keep-case",
    type: "story",
    position: { x: COL_WIDTH, y: ROW_HEIGHT },
    data: {
      label: "Keep the Case",
      description: "~58 hour unlock process, may hurt trader rep",
      isIrreversible: true,
    },
  },

  // ============ ROW 2 ============
  {
    id: "lk-unlock",
    type: "story",
    position: { x: -COL_WIDTH, y: ROW_HEIGHT * 2 },
    data: {
      label: "Network Provider Pt 1",
      description: "Early Lightkeeper access via Mechanic (skips grind)",
      isCompleted: true,
    },
  },
  {
    id: "unlock-case",
    type: "story",
    position: { x: COL_WIDTH, y: ROW_HEIGHT * 2 },
    data: {
      label: "Unlock Case",
      description: "Open the case yourself",
    },
  },

  // ============ ROW 3 ============
  {
    id: "get-case-back",
    type: "story",
    position: { x: -COL_WIDTH, y: ROW_HEIGHT * 3 },
    data: {
      label: "LK Returns Case",
      description: "Do LK a favor, he gives case back to open",
      isCompleted: true,
    },
  },
  {
    id: "trust-kerman-keep",
    type: "decision",
    position: { x: COL_WIDTH, y: ROW_HEIGHT * 3 },
    data: {
      label: "Trust Kerman?",
      description: "Work with Kerman or not?",
      isIrreversible: true,
    },
  },

  // ============ ROW 4: Trust decisions ============
  {
    id: "trust-kerman-prapor",
    type: "decision",
    position: { x: -COL_WIDTH, y: ROW_HEIGHT * 4 },
    data: {
      label: "Trust Kerman?",
      description: "Side with Kerman or not?",
      isIrreversible: true,
    },
  },
  {
    id: "dont-trust-keep",
    type: "story",
    position: { x: COL_WIDTH * 0.5, y: ROW_HEIGHT * 4 },
    data: {
      label: "Don't Trust Kerman",
      description: "Refuse Kerman",
    },
  },
  {
    id: "work-kerman-keep",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 4 },
    data: {
      label: "Work with Kerman",
      description: "Agree to work with Kerman",
    },
  },

  // ============ ROW 5 ============
  {
    id: "dont-trust-prapor",
    type: "story",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 5 },
    data: {
      label: "Don't Trust Kerman",
      description: "Refuse to work with Kerman",
    },
  },
  {
    id: "trust-kerman-prapor-yes",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 5 },
    data: {
      label: "Side with Kerman",
      description: "Agree to work with Mr. Kerman",
      isCompleted: true,
    },
  },
  {
    id: "pay-500m-keep",
    type: "story",
    position: { x: COL_WIDTH * 0.5, y: ROW_HEIGHT * 5 },
    data: {
      label: "Pay 500m Roubles",
      description: "Pay Prapor 500 million",
      cost: 500000000,
    },
  },
  {
    id: "use-jammer-case",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 5 },
    data: {
      label: "Use Jammer on Case",
      description: "Use the jammer on the case",
    },
  },

  // ============ ROW 6 ============
  {
    id: "pay-prapor-choice",
    type: "decision",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 6 },
    data: {
      label: "Pay Prapor",
      description: "How much to pay?",
    },
  },
  {
    id: "lk-blue-folders",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 6 },
    data: {
      label: "LK Wants 3 Blue Folders",
      description: "Collect 3 blue folders for Lightkeeper",
      isCompleted: true,
    },
  },
  {
    id: "turn-in-btc",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 6 },
    data: {
      label: "Turn in 40 Bitcoins",
      description: "Hand over 40 BTC",
      cost: 40,
    },
  },

  // ============ ROW 7 ============
  {
    id: "pay-300m",
    type: "story",
    position: { x: -COL_WIDTH * 2.3, y: ROW_HEIGHT * 7 },
    data: {
      label: "Pay 300m Roubles",
      description: "Pay Prapor 300 million",
      cost: 300000000,
    },
  },
  {
    id: "pay-500m",
    type: "story",
    position: { x: -COL_WIDTH * 1.5, y: ROW_HEIGHT * 7 },
    data: {
      label: "Pay 500m Roubles",
      description: "Pay Prapor 500 million",
      cost: 500000000,
    },
  },
  {
    id: "lk-flare-kills",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 7 },
    data: {
      label: "Yellow Flare + 15 Kills",
      description: "LK wants yellow flare and 15 kills on Interchange",
      isCompleted: true,
    },
  },
  {
    id: "get-rfid",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 7 },
    data: {
      label: "Get RFID Encrypter",
      description: "Receive RFID encryption device",
    },
  },

  // ============ ROW 8 ============
  {
    id: "tell-prapor-no-money",
    type: "story",
    position: { x: -COL_WIDTH * 1.8, y: ROW_HEIGHT * 8 },
    data: {
      label: "Can't Pay / Won't Pay",
      description: "'Fall into darkness' - Currently disabled/game over",
      note: "* Leads to immediate death state",
    },
  },
  {
    id: "lk-jammer",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 8 },
    data: {
      label: "Jammer from Labs",
      description: "LK wants jammer from Labs",
      isCompleted: true,
    },
  },
  {
    id: "craft-keycard",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 8 },
    data: {
      label: "Craft/Swipe Keycard",
      description: "Create or swipe the keycard",
    },
  },

  // ============ ROW 9 ============
  {
    id: "craft-case",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 9 },
    data: {
      label: "55 Hour Craft",
      description: "Craft for case (55 hours)",
      isCompleted: true,
    },
  },
  {
    id: "talk-kerman-again",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 9 },
    data: {
      label: "Talk to Kerman",
      description: "Report back to Kerman",
    },
  },

  // ============ ROW 10 ============
  {
    id: "opened-case-kerman",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 10 },
    data: {
      label: "Opened Case - Sided with Kerman",
      description: "Case opened, working with Mr. Kerman",
      isCompleted: true,
    },
  },
  {
    id: "agree-terragroup",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 10 },
    data: {
      label: "Find Dirt on Terragroup",
      description: "Agree to work with Kerman again",
    },
  },

  // ============ ROW 11 ============
  {
    id: "find-encrypt-items",
    type: "story",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 11 },
    data: {
      label: "Find Encryption Items",
      description: "Currently looking for items to encrypt the keycard",
      isCurrentStep: true,
    },
  },
  {
    id: "get-intel-3",
    type: "story",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 11 },
    data: {
      label: "Get Intel 3",
      description: "Obtain Intel 3",
    },
  },

  // ============ SIDE QUESTS (Required for Utopia) ============
  {
    id: "side-quests",
    type: "decision",
    position: { x: 0, y: ROW_HEIGHT * 12 },
    data: {
      label: "Complete Side Quests?",
      description: "Batya, Bogatyr, Chronicles of Ryzhy, etc.",
      isIrreversible: true,
    },
  },

  // ============ ROW 13: Terminal Battle ============
  {
    id: "terminal-battle",
    type: "decision",
    position: { x: 0, y: ROW_HEIGHT * 13.5 },
    data: {
      label: "Terminal Battle",
      description: "Fight Black Division at Terminal - Do you survive?",
      isIrreversible: true,
    },
  },

  // ============ ROW 15: ENDINGS (BOTTOM - aligned) ============
  {
    id: "debtor-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 1.5, y: ROW_HEIGHT * 15.5 },
    data: {
      label: "Debtor Ending",
      description: "Bad: 'Fall into darkness' - Thrall to dark forces",
      endingType: "debtor",
    },
  },
  {
    id: "survivor-ending",
    type: "ending",
    position: { x: -COL_WIDTH * 0.5, y: ROW_HEIGHT * 15.5 },
    data: {
      label: "Survivor Ending",
      description: "Selfish: Escape alone, Tarkov left to rot",
      endingType: "survivor",
    },
  },
  {
    id: "fallen-ending",
    type: "ending",
    position: { x: COL_WIDTH * 0.5, y: ROW_HEIGHT * 15.5 },
    data: {
      label: "Fallen Ending",
      description: "Low Effort: Skipped side quests, Cultists win",
      endingType: "fallen",
    },
  },
  {
    id: "savior-ending",
    type: "ending",
    position: { x: COL_WIDTH * 1.5, y: ROW_HEIGHT * 15.5 },
    data: {
      label: "Savior Ending",
      description:
        "True: Save Tarkov! Complete ALL side quests + survive Terminal",
      endingType: "savior",
    },
  },
];

const initialEdges: Edge[] = [
  // From start
  {
    id: "e-start-give",
    source: "start",
    target: "give-prapor",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-start-keep",
    source: "start",
    target: "keep-case",
    style: { stroke: "#666" },
  },

  // Give Prapor path
  {
    id: "e-give-lk",
    source: "give-prapor",
    target: "lk-unlock",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-lk-case",
    source: "lk-unlock",
    target: "get-case-back",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-case-trust",
    source: "get-case-back",
    target: "trust-kerman-prapor",
    animated: true,
    style: { stroke: "#22c55e" },
  },

  // Don't trust from Prapor path - SURVIVOR (blue) & DEBTOR (red) paths
  {
    id: "e-trust-no",
    source: "trust-kerman-prapor",
    target: "dont-trust-prapor",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-notrust-pay",
    source: "dont-trust-prapor",
    target: "pay-prapor-choice",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-pay-300",
    source: "pay-prapor-choice",
    target: "pay-300m",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-pay-500",
    source: "pay-prapor-choice",
    target: "pay-500m",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-pay-none",
    source: "pay-prapor-choice",
    target: "tell-prapor-no-money",
    style: { stroke: "#ef4444" },
  },
  {
    id: "e-300-survivor",
    source: "pay-300m",
    target: "survivor-ending",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-500-survivor",
    source: "pay-500m",
    target: "survivor-ending",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-nomoney-debtor",
    source: "tell-prapor-no-money",
    target: "debtor-ending",
    style: { stroke: "#ef4444" },
  },

  // Trust Kerman from Prapor path (YOUR PATH)
  {
    id: "e-trust-yes",
    source: "trust-kerman-prapor",
    target: "trust-kerman-prapor-yes",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-kerman-folders",
    source: "trust-kerman-prapor-yes",
    target: "lk-blue-folders",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-folders-flare",
    source: "lk-blue-folders",
    target: "lk-flare-kills",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-flare-jammer",
    source: "lk-flare-kills",
    target: "lk-jammer",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-jammer-craft",
    source: "lk-jammer",
    target: "craft-case",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-craft-opened",
    source: "craft-case",
    target: "opened-case-kerman",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-opened-encrypt",
    source: "opened-case-kerman",
    target: "find-encrypt-items",
    animated: true,
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-encrypt-sidequests",
    source: "find-encrypt-items",
    target: "side-quests",
    animated: true,
    style: { stroke: "#22c55e" },
  },

  // Keep case path (gray/neutral)
  {
    id: "e-keep-unlock",
    source: "keep-case",
    target: "unlock-case",
    style: { stroke: "#666" },
  },
  {
    id: "e-unlock-trust",
    source: "unlock-case",
    target: "trust-kerman-keep",
    style: { stroke: "#666" },
  },

  // Don't trust from Keep path - leads to SURVIVOR (blue)
  {
    id: "e-keep-notrust",
    source: "trust-kerman-keep",
    target: "dont-trust-keep",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-notrust-500",
    source: "dont-trust-keep",
    target: "pay-500m-keep",
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e-500keep-survivor",
    source: "pay-500m-keep",
    target: "survivor-ending",
    style: { stroke: "#3b82f6" },
  },

  // Trust Kerman from Keep path - leads to UTOPIA (purple tint for alternate route)
  {
    id: "e-keep-trust",
    source: "trust-kerman-keep",
    target: "work-kerman-keep",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-work-jammer",
    source: "work-kerman-keep",
    target: "use-jammer-case",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-jammer-btc",
    source: "use-jammer-case",
    target: "turn-in-btc",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-btc-rfid",
    source: "turn-in-btc",
    target: "get-rfid",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-rfid-keycard",
    source: "get-rfid",
    target: "craft-keycard",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-keycard-talk",
    source: "craft-keycard",
    target: "talk-kerman-again",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-talk-terra",
    source: "talk-kerman-again",
    target: "agree-terragroup",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-terra-intel",
    source: "agree-terragroup",
    target: "get-intel-3",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-intel-sidequests",
    source: "get-intel-3",
    target: "side-quests",
    style: { stroke: "#8b5cf6", strokeDasharray: "5,5" },
  },

  // Side quests to Terminal battle
  {
    id: "e-sidequests-terminal",
    source: "side-quests",
    target: "terminal-battle",
  },

  // Terminal battle outcomes
  {
    id: "e-terminal-savior",
    source: "terminal-battle",
    target: "savior-ending",
    label: "Survive + All Quests",
    style: { stroke: "#22c55e" },
  },
  {
    id: "e-terminal-fallen",
    source: "terminal-battle",
    target: "fallen-ending",
    label: "Survive (No Quests)",
    style: { stroke: "#6b7280" },
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodes((prev) => {
        if (prev.includes(node.id)) {
          return prev.filter((id) => id !== node.id);
        }
        return [...prev, node.id];
      });

      // Toggle completion status
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id && n.type === "story") {
            return {
              ...n,
              data: {
                ...n.data,
                isCompleted: !n.data.isCompleted,
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  const calculateTotalCost = useCallback(() => {
    return nodes
      .filter((n) => n.data.isCompleted && n.data.cost)
      .reduce((sum, n) => sum + (n.data.cost as number), 0);
  }, [nodes]);

  return (
    <div className="app-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag
        panOnDrag
        zoomOnScroll
        className="dark-flow"
      >
        <Controls className="controls" />
        <MiniMap
          className="minimap"
          nodeColor={(node) => {
            if (node.data.isCurrentStep) return "#f59e0b";
            if (node.data.isCompleted) return "#22c55e";
            if (node.type === "decision") return "#c9a227";
            if (node.type === "ending") return "#ef4444";
            return "#444";
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1a1a1a"
        />
        <Panel position="top-left" className="title-panel">
          <h1>Tarkov Storyline Map</h1>
          <p>
            Click nodes to mark as completed • Pan to navigate • Scroll to zoom
          </p>
        </Panel>
        <CostPanel totalCost={calculateTotalCost()} nodes={nodes} />
      </ReactFlow>
    </div>
  );
}

export default App;
