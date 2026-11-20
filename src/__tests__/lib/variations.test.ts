import { describe, it, expect } from "vitest";
import { computeVariation } from "@/lib/variations";

describe("computeVariation", () => {
  it("retourne 'first' quand il n'y a pas de valeur précédente", () => {
    const result = computeVariation(100, null);
    expect(result.label).toBe("first");
    expect(result.absolute).toBeNull();
    expect(result.percentage).toBeNull();
  });

  it("retourne 'stable' quand les valeurs sont identiques", () => {
    const result = computeVariation(100, 100);
    expect(result.label).toBe("stable");
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("retourne 'up' quand la valeur augmente", () => {
    const result = computeVariation(120, 100);
    expect(result.label).toBe("up");
    expect(result.absolute).toBe(20);
    expect(result.percentage).toBeCloseTo(20);
  });

  it("retourne 'down' quand la valeur diminue", () => {
    const result = computeVariation(80, 100);
    expect(result.label).toBe("down");
    expect(result.absolute).toBe(-20);
    expect(result.percentage).toBeCloseTo(-20);
  });

  it("retourne percentage null quand la valeur précédente est 0", () => {
    const result = computeVariation(50, 0);
    expect(result.label).toBe("up");
    expect(result.absolute).toBe(50);
    expect(result.percentage).toBeNull();
  });

  it("gère les grandes valeurs correctement", () => {
    const result = computeVariation(1500, 1000);
    expect(result.label).toBe("up");
    expect(result.absolute).toBe(500);
    expect(result.percentage).toBeCloseTo(50);
  });

  it("gère la valeur 0 avec précédent 0", () => {
    const result = computeVariation(0, 0);
    expect(result.label).toBe("stable");
    expect(result.absolute).toBe(0);
  });
});
