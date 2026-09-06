import { PromptTemplate } from "../types";

export const STARTER_TEMPLATES: PromptTemplate[] = [
  {
    id: "template-clarity",
    title: "Deep Mind Dump & Clarification",
    tagline: "Unpack tangled thoughts into an organized roadmap",
    category: "Clarity",
    prompt:
      "I'm feeling mentally overwhelmed by several competing priorities today. Can you help me do a structured mind dump, untangle what matters most, and identify the single most impactful lever to focus on?",
  },
  {
    id: "template-strategy",
    title: "Strategic Crossroads & Decision Matrix",
    tagline: "Stress-test a major decision with first-principles",
    category: "Strategy",
    prompt:
      "I am facing an important crossroad in my career/project. Let's analyze the 2 main paths: what are the second-order consequences, hidden assumptions, and asymmetric upsides or downside risks?",
  },
  {
    id: "template-stoic",
    title: "Evening Stoic Retrospective",
    tagline: "Reflect on control, temperament, and intentionality",
    category: "Reflection",
    prompt:
      "Let's conduct an evening reflection. Ask me three gentle prompts: what was in my direct control today, where did I let reactive frustration creep in, and what virtue can I carry into tomorrow?",
  },
  {
    id: "template-reframing",
    title: "Cognitive Reframing & Anxious Thoughts",
    tagline: "Examine catastrophic or black-and-white assumptions",
    category: "Reflection",
    prompt:
      "I notice a persistent worry creeping up about an upcoming outcome. Help me examine the cognitive distortion, separate facts from catastrophic speculation, and reframe this with grounded confidence.",
  },
  {
    id: "template-creativity",
    title: "Creative Breakthrough & Idea Synthesis",
    tagline: "Brainstorm unexpected angles for an ambitious project",
    category: "Creativity",
    prompt:
      "I want to brainstorm a creative concept that stands apart from standard approaches. Act as an incisive creative director and challenge me with 3 unconventional angles or provocative constraints.",
  },
];
