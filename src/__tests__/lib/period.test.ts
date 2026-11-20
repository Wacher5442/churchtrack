import { describe, it, expect } from "vitest";
import { getSundayOfWeek, getWeekEnd, getCurrentPeriod } from "@/lib/period";

describe("getSundayOfWeek", () => {
  it("retourne le dimanche de la semaine pour un dimanche", () => {
    // 2026-11-08 est un dimanche
    const sunday = new Date("2026-11-08T12:00:00Z");
    const result = getSundayOfWeek(sunday);
    expect(result.getDay()).toBe(0); // 0 = dimanche
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("retourne le dimanche précédent pour un lundi", () => {
    const monday = new Date("2026-11-09T12:00:00Z");
    const result = getSundayOfWeek(monday);
    expect(result.getDay()).toBe(0);
    // Le lundi 9 → dimanche 8
    expect(result.getDate()).toBeLessThan(monday.getDate());
  });

  it("retourne le dimanche précédent pour un samedi", () => {
    const saturday = new Date("2026-11-14T12:00:00Z");
    const result = getSundayOfWeek(saturday);
    expect(result.getDay()).toBe(0);
  });

  it("heure remise à zéro", () => {
    const date = new Date("2026-11-10T18:30:00Z");
    const result = getSundayOfWeek(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe("getWeekEnd", () => {
  it("retourne le samedi à 23:59:59 de la même semaine", () => {
    const sunday = new Date("2026-11-08T00:00:00");
    const result = getWeekEnd(sunday);
    expect(result.getDay()).toBe(6); // 6 = samedi
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });

  it("weekEnd est le samedi de la même semaine (6 jours calendaires plus tard)", () => {
    const sunday = new Date("2026-11-08T00:00:00");
    const result = getWeekEnd(sunday);
    // 8 nov (dim) + 6 jours = 14 nov (sam)
    expect(result.getDate()).toBe(14);
    expect(result.getMonth()).toBe(10); // novembre = 10 (0-indexé)
  });
});

describe("getCurrentPeriod", () => {
  it("retourne un weekStart qui est un dimanche", () => {
    const { weekStart } = getCurrentPeriod();
    expect(weekStart.getDay()).toBe(0);
  });

  it("weekEnd est après weekStart", () => {
    const { weekStart, weekEnd } = getCurrentPeriod();
    expect(weekEnd.getTime()).toBeGreaterThan(weekStart.getTime());
  });

  it("weekStart a l'heure à minuit", () => {
    const { weekStart } = getCurrentPeriod();
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(weekStart.getSeconds()).toBe(0);
  });

  it("weekEnd est à 23:59:59", () => {
    const { weekEnd } = getCurrentPeriod();
    expect(weekEnd.getHours()).toBe(23);
    expect(weekEnd.getMinutes()).toBe(59);
    expect(weekEnd.getSeconds()).toBe(59);
  });
});
